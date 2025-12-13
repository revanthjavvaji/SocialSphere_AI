from typing import List, Any
from sqlalchemy.orm import Session
import uuid
import os
import numpy as np

from RAG.data_loader import load_documents_from_paths
from RAG.vectorstore import FaissVectorStore
from RAG.embedding import EmbeddingPipeline


def process_documents(bid: Any, file_paths: List[str], persist_directory: str = None):
    """
    Process a list of files for a specific Business ID (bid).
    1. Load documents
    2. Chunk and Embed
    3. Store in bid-specific VectorStore
    """
    print(f"[INFO] Processing {len(file_paths)} files for BID {bid}...")
    
    # 1. Load
    docs = load_documents_from_paths(file_paths)
    if not docs:
        print("[WARN] No documents loaded.")
        return 0

    # 2. Setup Pipeline Components
    # Note: Using default model/chunk settings from vectorstore/embedding classes
    # If persist_directory is explicit, use it. Otherwise rely on default or implicit logic.
    if persist_directory:
        store = FaissVectorStore(bid=bid, persist_dir=persist_directory)
    else:
        store = FaissVectorStore(bid=bid)

    # Try to load existing index to append
    try:
        store.load()
    except Exception:
        print(f"[INFO] No existing index for BID {bid}. Creating new.")

    emb_pipe = EmbeddingPipeline(model_name=store.embedding_model, 
                                 chunk_size=store.chunk_size, 
                                 chunk_overlap=store.chunk_overlap)

    # 3. Chunk
    print("[INFO] Chunking documents...")
    chunks = emb_pipe.chunk_documents(docs)
    if not chunks:
        print("[WARN] No chunks generated.")
        return 0

    # 4. Embed
    print(f"[INFO] Embedding {len(chunks)} chunks...")
    embeddings = emb_pipe.embed_chunks(chunks)

    # 5. Store in FAISS
    start_idx = 0
    if store.index is not None:
        start_idx = store.index.ntotal
    
    # Prepare metadata for FAISS (keeping it simple for retrieval)
    faiss_metadatas = [{"text": chunk.page_content, "source": chunk.metadata.get("source", "")} for chunk in chunks]
    
    store.add_embeddings(np.array(embeddings).astype('float32'), faiss_metadatas)
    store.save()

    # 6. Store in SQL DB (DocDetails) - REMOVED
    
    print(f"[INFO] Successfully processed {len(chunks)} chunks for BID {bid}.")
        
    return len(chunks)
