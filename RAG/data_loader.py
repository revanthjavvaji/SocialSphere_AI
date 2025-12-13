from pathlib import Path
from typing import List, Any
from langchain_community.document_loaders import PyPDFLoader, TextLoader, CSVLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders.excel import UnstructuredExcelLoader
from langchain_community.document_loaders import JSONLoader


def load_single_document(file_path: Path) -> List[Any]:
    """Helper to load a single file based on extension."""
    file_path = Path(file_path)
    ext = file_path.suffix.lower()
    documents = []
    
    try:
        if ext == '.pdf':
            loader = PyPDFLoader(str(file_path))
            documents = loader.load()
        elif ext == '.txt':
            loader = TextLoader(str(file_path))
            documents = loader.load()
        elif ext == '.csv':
            loader = CSVLoader(str(file_path))
            documents = loader.load()
        elif ext == '.xlsx':
            loader = UnstructuredExcelLoader(str(file_path))
            documents = loader.load()
        elif ext == '.docx':
            loader = Docx2txtLoader(str(file_path))
            documents = loader.load()
        elif ext == '.json':
            loader = JSONLoader(str(file_path))
            documents = loader.load()
        else:
            print(f"[WARN] Unsupported file type: {ext}")
            return []
            
        print(f"[DEBUG] Loaded {len(documents)} docs from {file_path}")
        return documents
    except Exception as e:
        print(f"[ERROR] Failed to load {file_path}: {e}")
        return []

def load_documents_from_paths(file_paths: List[str]) -> List[Any]:
    """Load documents from a specific list of file paths."""
    print(f"[DEBUG] Loading {len(file_paths)} specific files...")
    documents = []
    for fp in file_paths:
        docs = load_single_document(Path(fp))
        documents.extend(docs)
    print(f"[DEBUG] Total loaded documents: {len(documents)}")
    return documents

def load_all_documents(data_dir: str) -> List[Any]:
    """
    Load all supported files from the data directory and convert to LangChain document structure.
    Supported: PDF, TXT, CSV, Excel, Word, JSON
    """
    # Use project root data folder
    data_path = Path(data_dir).resolve()
    print(f"[DEBUG] Data path: {data_path}")
    
    # Collect all files
    all_files = []
    extensions = ['*.pdf', '*.txt', '*.csv', '*.xlsx', '*.docx', '*.json']
    for ext in extensions:
        all_files.extend(list(data_path.glob(f'**/{ext}')))
        
    print(f"[DEBUG] Found {len(all_files)} files in directory.")
    return load_documents_from_paths([str(f) for f in all_files])

