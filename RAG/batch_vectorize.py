import os
import sys
import glob

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from RAG.pipeline import process_documents

PDF_SOURCE_DIR = r"D:\SocialSphereAI\pdfs"
RAG_OUTPUT_DIR = r"D:\SocialSphereAI\SocialSphere_AI\RAG\pdfs_vectorized"

def process_batches():
    if not os.path.exists(PDF_SOURCE_DIR):
        print(f"[ERROR] Source directory not found: {PDF_SOURCE_DIR}")
        return

    # Create base output directory
    os.makedirs(RAG_OUTPUT_DIR, exist_ok=True)

    # Iterate through each subdirectory in the PDF source folder
    for category in os.listdir(PDF_SOURCE_DIR):
        category_path = os.path.join(PDF_SOURCE_DIR, category)
        
        if os.path.isdir(category_path):
            print(f"\n[INFO] Processing Category: {category}")
            
            # Find all PDF files in this category
            pdf_files = glob.glob(os.path.join(category_path, "*.pdf"))
            
            if not pdf_files:
                print(f"[WARN] No PDF files found in {category_path}")
                continue
                
            print(f"[INFO] Found {len(pdf_files)} PDFs in {category}...")
            
            # Call process_documents
            # bid is treated as the category name here. 
            # We pass RAG_OUTPUT_DIR as the persist directory.
            # FaissVectorStore will create a subdirectory named after 'bid' (Category) inside RAG_OUTPUT_DIR.
            try:
                count = process_documents(bid=category, file_paths=pdf_files, persist_directory=RAG_OUTPUT_DIR)
                print(f"[SUCCESS] Processed {count} chunks for category '{category}'")
            except Exception as e:
                print(f"[ERROR] Failed to process category '{category}': {e}")
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    process_batches()
