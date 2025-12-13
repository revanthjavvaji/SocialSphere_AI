from vectorstore import FaissVectorStore
from data_loader import load_all_documents

if __name__ == "__main__":
    docs = load_all_documents("pdfs/")
    store = FaissVectorStore("faiss_store")
    store.build_from_documents(docs)
    store.load()
    # Testing
    print(store.query("What is attention mechanism?", top_k=3))