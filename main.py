from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from sqlalchemy import func
from passlib.context import CryptContext
import models
import schemas


models.Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "online"}


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists (case-insensitive)
    existing_user = db.query(models.UserCredentials).filter(models.UserCredentials.email == user.Email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Calculate new bid
    max_bid = db.query(func.max(models.BusinessInfo.bid)).scalar()
    bid = 1 if max_bid is None else max_bid + 1


    # Create BusinessInfo record
    business_info = models.BusinessInfo(
        bid=bid,
        full_name=user.Full_Name,
        business_name=user.business_name,
        industry=user.Industry,
        country=user.Country,
        business_website=user.Business_website,
        business_size=user.Business_Size,
        brand_color=user.Brand_color
    )

    # Create Connectors record
    connectors = models.Connectors(
        bid=bid,
        insta_api_key=user.Insta_API_KEY,
        insta_user_id=user.Insta_user_id,
        facebook_api_key=user.Facebook_API_KEY,
        facebook_page_id=user.Facebook_page_id,
        linkedin_access_token=user.Linkedin_access_token,
        linkedin_author_urn=user.Linkedin_Author_URN,
        google_connector_email=user.Google_connecter_email,
        google_api_key=user.Google_api_key
    )

    # Create UserCredentials record
    hashed_password = pwd_context.hash(user.Password)
    user_credentials = models.UserCredentials(
        bid=bid,
        email=user.Email.lower(),
        password=hashed_password
    )


    # Add to session and commit
    db.add(business_info)
    db.add(connectors)
    db.add(user_credentials)
    
    try:
        db.commit()
        db.refresh(business_info)
        db.refresh(connectors)
        db.refresh(user_credentials)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "User registered successfully", "bid": bid}

@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.UserCredentials).filter(models.UserCredentials.email == user.Email.lower()).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check password
    if not pwd_context.verify(user.Password, db_user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    
    # Fetch related data
    business_info = db.query(models.BusinessInfo).filter(models.BusinessInfo.bid == db_user.bid).first()
    connectors = db.query(models.Connectors).filter(models.Connectors.bid == db_user.bid).first()

    # Construct response
    response_data = {
        "fullName": business_info.full_name if business_info else "",
        "email": db_user.email,
        "businessName": business_info.business_name if business_info else "",
        "industry": business_info.industry if business_info else "",
        "region": business_info.country if business_info else "",
        "businessWebsite": business_info.business_website if business_info else "",
        "businessSize": business_info.business_size if business_info else "",
        "logoColor": business_info.brand_color if business_info else "",
        # Add other fields as needed by the frontend
        "instagramApiKey": connectors.insta_api_key if connectors else "",
        "instagramUserId": connectors.insta_user_id if connectors else "",
        "facebookApiKey": connectors.facebook_api_key if connectors else "",
        "facebookPageId": connectors.facebook_page_id if connectors else "",
        "linkedinAccessToken": connectors.linkedin_access_token if connectors else "",
        "linkedinAuthorUrl": connectors.linkedin_author_urn if connectors else "",
        "googleConnectorEmail": connectors.google_connector_email if connectors else "",
        "googleApiKey": connectors.google_api_key if connectors else "",
    }

    return {"message": "Login successful", "user": response_data}

from typing import List
from fastapi import File, UploadFile
import shutil
import os
from RAG.pipeline import process_documents
from RAG.vectorstore import FaissVectorStore

@app.post("/upload-documents/{bid}")
def upload_documents(bid: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed.")
    
    saved_files = []
    temp_dir = f"temp_uploads_{bid}"
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_files.append(file_path)
            
        count = process_documents(bid, saved_files)
        return {"message": "Documents processed successfully", "chunks_added": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.post("/query/{bid}")
def query_documents(bid: int, query: str, db: Session = Depends(get_db)):
    try:
        store = FaissVectorStore(bid=bid)
        try:
            store.load()
        except Exception:
            # If load fails (e.g. index not found), return empty or error
            return {"results": [], "message": "No documents found for this Business ID."}
            
        results = store.query(query, top_k=5)
        return {"results": results}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

