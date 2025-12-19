import os
import sys

# Add the project root to sys.path to allow imports if run as a script
# This adds the parent directory of 'RAG' (i.e., project root) to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
# Try importing from RAG package first, assuming run from root with -m or configured path
try:
    from RAG.vectorstore import FaissVectorStore
except ImportError:
    # Fallback for direct script execution if package structure isn't recognized
    from vectorstore import FaissVectorStore

from langchain_groq import ChatGroq

# Load .env explicitly from the project root
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(project_root, ".env"))

class RAGSearch:
    def __init__(self, bid: int, persist_dir: str = None, embedding_model: str = "all-MiniLM-L6-v2", llm_model: str = "openai/gpt-oss-120b"):
        self.bid = bid
        
        # Determine strict project root path for faiss_store
        if persist_dir is None:
            # Assuming this script is in RAG/ folder, go up one level
            base_dir = os.path.dirname(os.path.abspath(__file__)) # D:\SocialSphereAI\SocialSphere_AI\RAG
            project_root = os.path.abspath(os.path.join(base_dir, '..')) # D:\SocialSphereAI\SocialSphere_AI
            persist_dir = os.path.join(project_root, "faiss_store")

        # Initialize VectorStore with business ID
        self.vectorstore = FaissVectorStore(bid=self.bid, persist_dir=persist_dir, embedding_model=embedding_model)
        
        # Load vectorstore for the specific BID
        # Note: FaissVectorStore handles the subdirectory logic based on bid (persist_dir/bid)
        try:
             self.vectorstore.load()
        except Exception as e:
             print(f"[WARN] Could not load vector store for BID {bid}: {e}")
             print("Search results will be empty until documents are uploaded and processed.")

        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
             print("[WARN] GROQ_API_KEY not found in environment variables.")
             
        self.llm = ChatGroq(groq_api_key=groq_api_key, model_name=llm_model)
        print(f"[INFO] Groq LLM initialized: {llm_model}")

    def search_and_summarize(self, query: str, top_k: int = 5) -> str:
        if self.vectorstore.index is None:
             return "Vector store not loaded or empty."
             
        results = self.vectorstore.query(query, top_k=top_k)
        texts = [r["metadata"].get("text", "") for r in results if r["metadata"]]
        
        if not texts:
            return "No relevant documents found."
            
        context = "\n\n".join(texts)
        prompt = f"""Answer the Given Query Refering to Given Context: '{query}'\n\nContext:\n{context}\n\nSummary:"""
        try:
            response = self.llm.invoke([prompt])
            return response.content
        except Exception as e:
            return f"Error gathering summary: {str(e)}"

# Example usage
if __name__ == "__main__":
    # Example BID 1 (Change this to test other business IDs)
    test_bid = 3
    print(f"--- Testing RAG Search for BID {test_bid} ---")
    
    rag_search = RAGSearch(bid=test_bid)
    
    query = "What Are the Best Social Media Marketing Strategies for Restaurants?"
    print(f"Query: {query}")
    
    summary = rag_search.search_and_summarize(query, top_k=1)
    print("\nSummary Output:")
    print(summary)
