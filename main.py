from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
import schemas
import uuid

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.UserCredentials).filter(models.UserCredentials.email == user.Email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate UUID
    bid = str(uuid.uuid4())

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
    user_credentials = models.UserCredentials(
        bid=bid,
        email=user.Email,
        password=user.Password 
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
    db_user = db.query(models.UserCredentials).filter(models.UserCredentials.email == user.Email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check password
    if db_user.password != user.Password:
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
