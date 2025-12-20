from fastapi import FastAPI, Depends, HTTPException, status
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from sqlalchemy import func
from passlib.context import CryptContext
import models
from models import PostHistory, ChatHistory
import schemas
import os
from loguru import logger

models.Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

from contextlib import asynccontextmanager
from Agents.agent_service import agent_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start Agent Service
    await agent_service.start()
    yield
    # Shutdown: Stop Agent Service
    await agent_service.stop()

from starlette.middleware.sessions import SessionMiddleware
from fastapi import Request

# SECRET_KEY for signing session cookies. In production, this should be in .env
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "super-secret-session-key-change-me")

app = FastAPI(lifespan=lifespan)

from app_context import set_bid

@app.middleware("http")
async def set_bid_context_middleware(request: Request, call_next):
    # Attempt to retrieve 'bid' from session
    bid = request.session.get("bid")
    if bid:
        set_bid(bid)
    
    response = await call_next(request)
    return response

# Add Session Middleware
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY, https_only=False, same_site="lax")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8080", "http://127.0.0.1:8080"
    ], # Specific origins for credentials support
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
    print(f"Registration Attempt: {user.dict()}")
    # Check if email already exists (case-insensitive)
    existing_user = db.query(models.UserCredentials).filter(models.UserCredentials.email == user.Email.lower()).first()
    if existing_user:
        print("Registration Failed: Email exists")
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
        x_api_key=user.X_api_key,
        x_api_key_secret=user.X_api_key_secret,
        x_access_token=user.X_access_token,
        x_access_token_secret=user.X_access_token_secret,
        google_connector_email=user.Google_connecter_email,
        google_api_key=user.Google_api_key,
        gmail_access_token=user.Gmail_Access_Token,
        gmail_refresh_token=user.Gmail_Refresh_Token,
        gmail_token_expiry=user.Gmail_Token_Expiry
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
        print(f"Database Commit Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "User registered successfully", "bid": bid}

@app.post("/login")
def login_user(user: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
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

    # Construct response data
    user_data = {
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
        "xApiKey": connectors.x_api_key if connectors else "",
        "xApiKeySecret": connectors.x_api_key_secret if connectors else "",
        "xAccessToken": connectors.x_access_token if connectors else "",
        "xAccessTokenSecret": connectors.x_access_token_secret if connectors else "",
        "googleConnectorEmail": connectors.google_connector_email if connectors else "",
        "googleApiKey": connectors.google_api_key if connectors else "",
        "bid": db_user.bid
    }
    
    # START BACKEND SESSION
    request.session["user"] = user_data
    request.session["bid"] = db_user.bid
    print("BID Test: ", db_user.bid)
    set_bid(db_user.bid) # Ensure context is available immediately in this request

    return {"message": "Login successful", "user": user_data}

@app.post("/logout")
def logout_user(request: Request):
    """Destroys the backend session."""
    request.session.clear()
    return {"message": "Logged out successfully"}

@app.get("/me")
def get_current_user(request: Request):
    """
    Checks if a valid backend session exists and returns the user data.
    Used for persistent login state on frontend reload.
    """
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user}

from typing import List
from fastapi import File, UploadFile
import shutil
import os
from RAG.pipeline import process_documents
from RAG.vectorstore import FaissVectorStore
from dotenv import load_dotenv
load_dotenv()
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
            return {"results": results}
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

import requests
from auth_utils import encrypt_token

@app.get("/auth/google/callback")
def google_auth_callback(code: str, state: str, db: Session = Depends(get_db)):
    """
    Exchanges authorization code for tokens and stores them encrypted.
    state: Should contain 'bid' (e.g., "bid=123" or just "123") to associate tokens with a business.
    """
    try:
        # 1. Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id": os.getenv("GOOGLE_OAUTH_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:8000/auth/google/callback") # Ensure this matches Console
        }
        
        response = requests.post(token_url, data=payload)
        response_data = response.json()
        
        if "error" in response_data:
            raise HTTPException(status_code=400, detail=f"Google OAuth Error: {response_data.get('error_description')}")
            
        access_token = response_data.get("access_token")
        refresh_token = response_data.get("refresh_token")
        expires_in = response_data.get("expires_in")
        
        print(f"DEBUG: Auth Callback - Received Access Token: {bool(access_token)}")
        print(f"DEBUG: Auth Callback - Received Refresh Token: {bool(refresh_token)}")
        if not refresh_token:
            print("DEBUG: WARNING - Google did NOT return a refresh_token. Check 'prompt=consent' parameter.")
        
        # 2. Extract bid from state
        
        if state == "signup":
            print("DEBUG: Google Auth Callback - State is 'signup'. Skipping DB save. Returning tokens to frontend.")
            # Encrypt tokens before sending to frontend
            encrypted_access_token = encrypt_token(access_token)
            encrypted_refresh_token = encrypt_token(refresh_token) if refresh_token else None
            
            html_content = f"""
            <html>
                <body>
                    <script>
                        window.opener.postMessage({{
                            type: "GOOGLE_AUTH_SUCCESS",
                            data: {{
                                accessToken: "{encrypted_access_token}",
                                refreshToken: "{encrypted_refresh_token}",
                                expiry: "{expires_in}",
                                email: "connected_via_oauth"
                            }}
                        }}, "*");
                        window.close();
                    </script>
                    <h1>Authentication Successful</h1>
                    <p>You can close this window now.</p>
                </body>
            </html>
            """
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=html_content)

        # Standard flow for existing users (e.g. from Dashboard)
        try:
            bid = int(state) 
        except ValueError:
             # Fallback if state is not an integer (and not "signup")
             raise HTTPException(status_code=400, detail="Invalid state parameter")

        # 3. Store tokens
        connector = db.query(models.Connectors).filter(models.Connectors.bid == bid).first()
        if not connector:
             connector = models.Connectors(bid=bid)
             db.add(connector)
        
        connector.gmail_access_token = encrypt_token(access_token)
        if refresh_token:
            connector.gmail_refresh_token = encrypt_token(refresh_token)
        connector.gmail_token_expiry = str(expires_in)
        
        db.commit()
        
        # 4. Redirect to Frontend
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173/dashboard?google_connected=true")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=frontend_url)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



import gmail_utils

@app.get("/gmail/daily/{bid}")
def get_daily_emails(bid: int, db: Session = Depends(get_db)):
    """Fetches emails from today and summarizes them for the specific business ID."""
    try:
        result = gmail_utils.fetch_todays_emails_and_summarize(bid, db)
        return result
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats/daily/{bid}")
def get_daily_stats(bid: int, db: Session = Depends(get_db)):
    """
    Fetches daily statistics for the agent console:
    - Posts Generated: Count of entries in PostHistory for today.
    - Posters Created: Count of entries in ChatHistory (with images) for today.
    """
    try:
        # 1. Get user email for this bid to filter history
        user = db.query(models.UserCredentials).filter(models.UserCredentials.bid == bid).first()
        if not user:
            # Fallback if no user found (shouldn't happen for valid bid views)
            return {"posts_generated": 0, "posters_created": 0}
        
        email = user.email
        today_prefix = datetime.now().isoformat()[:10] # YYYY-MM-DD
        
        # 2. Count Posts Generated (PostHistory)
        # Filter by username (email) and timestamp starting with today's date
        posts_count = db.query(PostHistory).filter(
            PostHistory.username == email,
            PostHistory.timestamp.startswith(today_prefix)
        ).count()
        
        # 3. Count Posters Created (ChatHistory)
        # Filter by username, timestamp, and ensure image_url is present (indicating a poster was made)
        # We assume 'posted=False' or True doesn't matter, just that it was created/logged.
        # But specifically looking for entries where an image was generated (image_url is not None).
        posters_count = db.query(ChatHistory).filter(
            ChatHistory.username == email,
            ChatHistory.timestamp.startswith(today_prefix),
            ChatHistory.image_url != None
        ).count()
        
        return {
            "posts_generated": posts_count,
            "posters_created": posters_count
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch daily stats: {e}")
        return {"posts_generated": 0, "posters_created": 0}

# ---------------------------------------------------------------------
# MCP Agent Endpoint
# ---------------------------------------------------------------------
from pydantic import BaseModel
from Agents.agent_service import agent_service

class AgentRequest(BaseModel):
    query: str

@app.post("/agent/chat")
async def chat_with_agent(request: AgentRequest, req: Request):
    """
    Endpoint to interact with the AI Agent (MCP + Groq).
    Uses backend session to provide context (bid, tokens, etc.) to the agent.
    """
    if not request.query:
        raise HTTPException(status_code=400, detail="Query is required")
    
    # Extract Context from Session
    user_session = req.session.get("user", {})
    bid = req.session.get("bid")
    
    logger.info(f"DEBUG: /agent/chat - Session BID: {bid}")
    logger.info(f"DEBUG: /agent/chat - Session User: {user_session.keys()}")

    context = {
        "bid": bid,
        "email": user_session.get("email"),
        "facebook_page_id": user_session.get("facebookPageId"),
        "instagram_id": user_session.get("instagramUserId"),
        "facebook_token": user_session.get("facebookApiKey"),
        "instagram_token": user_session.get("instagramApiKey"), # Assuming UI maps this key
        "linkedin_token": user_session.get("linkedinAccessToken")
    }

    try:
        # Run the agent asynchronously with context
        agent_res = await agent_service.run_query(request.query, context=context)
        response_text = str(agent_res)
        
        # Log to ChatHistory
        try:
            # Re-obtain session since it's a dependency usually but we can use SessionLocal here manually 
            # or refactor to inject db. simpler to just use SessionLocal for this side-effect.
            # However, depends(get_db) is not in this async function signature.
            db_log = SessionLocal()
            
            # Basic logic to detect if "posted" (very naive, can be improved)
            is_posted = "Successfully Published" in response_text or "Successfully posted" in response_text
            
            # Attempt to extract image_url if present in response_text (simple check)
            # This is heuristic. Ideally agent returns structured data.
            # For now, we leave image_url null unless we find a clear url in the text? 
            # or maybe the context had it? The prompt request said "Image url(url)".
            # If the user SENT an image, we don't handle that yet in input. 
            # usage: `1 explainableproject@gmail.com , {image_url} . text , timestamp , Facebook` in previous request.
            # In this request: `Image url(url)`
            # We will leave as None for now.
            
            chat_record = models.ChatHistory(
                username=user_session.get("email") or f"Unknown_bid_{bid}",
                input_message=request.query,
                agent_response=response_text,
                image_url=None, 
                timestamp=datetime.now().isoformat(),
                posted=is_posted
            )
            db_log.add(chat_record)
            db_log.commit()
            db_log.close()
        except Exception as log_e:
            logger.error(f"Failed to log chat history: {log_e}")

        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent failed: {str(e)}")
