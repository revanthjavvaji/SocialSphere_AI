from typing import Optional
from langchain.tools import tool
from sqlalchemy.orm import Session
from database import SessionLocal
from models import BusinessInfo
from RAG.vectorstore import FaissVectorStore
import os

# Base paths - typically these would be configured in environment or passed in, 
# but for now we hardcode relative to the project structure as requested.
# Assuming this file RAG/tools.py is in D:\SocialSphereAI\SocialSphere_AI\RAG
# We need to compute paths relative to that or absolute.

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDFS_VECTORIZED_DIR = os.path.join(PROJECT_ROOT, "RAG", "pdfs_vectorized")
USER_DOCS_STORE_DIR = os.path.join(PROJECT_ROOT, "faiss_store") # RAG/vectorstore.py default is "faiss_store", let's check exact logic.

@tool("search_social_sphere_context", description="Search for context related to a business query. Combines insights from broad industry knowledge (PDFs) and specific business documents.")
def search_social_sphere_context(bid: int, query: str) -> str:
    """
    Search for context related to a business query.
    Combines insights from broad industry knowledge (PDFs) and specific business documents.

    Args:
        bid: Business ID to scope the search.
        query: The search query string.
    """
    print(f"[TOOL] Searching context for BID: {bid}, Query: '{query}'")
    
    # 1. Get Industry from DB
    db: Session = SessionLocal()
    industry: Optional[str] = None
    try:
        business_info = db.query(BusinessInfo).filter(BusinessInfo.bid == bid).first()
        if business_info:
            industry = business_info.industry
            print(f"[TOOL] Found Industry: {industry}")
        else:
            print(f"[TOOL] properties not found for BID {bid}")
    except Exception as e:
        print(f"[TOOL] DB Error: {e}")
    finally:
        db.close()

    context_parts = []

    # 2. Context 1: Industry PDFs
    if industry:
        # The folder name might need sanitization or matching. Assuming direct match for now.
        # RAG/pdfs_vectorized/<Industry>
        # FaissVectorStore expects 'persist_dir' to be the PARENT of the specific index if 'bid' is passed, 
        # OR the exact path if we instantiate carefully.
        # Let's check RAG/vectorstore.py logic:
        # if bid is not None: persist_dir = os.path.join(persist_dir, str(bid))
        # So we can pass persist_dir=PDFS_VECTORIZED_DIR and bid=industry (if industry is used as folder name)
        
        try:
            # We treat 'industry' as the 'bid' (ID) for the vector store logic to point to the right subfolder
            industry_store = FaissVectorStore(bid=industry, persist_dir=PDFS_VECTORIZED_DIR)
            try:
                industry_store.load()
                results = industry_store.query(query, top_k=3)
                if results:
                    texts = [r["metadata"].get("text", "") for r in results if r.get("metadata")]
                    if texts:
                        context_parts.append(f"--- Industry Context ({industry}) ---\n" + "\n".join(texts))
            except Exception as e:
                print(f"[TOOL] Industry vector store not found/loaded: {e}")
        except Exception as e:
            print(f"[TOOL] Error initializing industry store: {e}")

    # 3. Context 2: User Uploaded Docs
    try:
        # Standard user docs are in faiss_store/<bid>
        # We pass the default persist_dir which is usually the root 'faiss_store' relative to execution,
        # or we explicitly use the full path.
        # We need to know where 'faiss_store' is created. 
        # In search.py: persist_dir = os.path.join(project_root, "faiss_store")
        
        user_store_path = os.path.join(PROJECT_ROOT, "faiss_store")
        user_store = FaissVectorStore(bid=bid, persist_dir=user_store_path)
        try:
            user_store.load()
            results = user_store.query(query, top_k=3)
            if results:
                texts = [r["metadata"].get("text", "") for r in results if r.get("metadata")]
                if texts:
                    context_parts.append(f"--- Business Specific Context ---\n" + "\n".join(texts))
        except Exception:
            # User context is optional. If not found, we simply skip it.
            # This is expected behavior for businesses that haven't uploaded documents yet.
            print(f"[TOOL] User vector store not found/loaded: {e}")
            pass

    except Exception as e:
        print(f"[TOOL] Error initializing user store: {e}")

    # 4. Combine
    # 4. Combine
    if not context_parts:
        return "No relevant context found. (Industry context missing and no user docs)."
    
    combined_context = "\n\n".join(context_parts)
    return combined_context

