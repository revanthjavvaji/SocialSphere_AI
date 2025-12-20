from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class BusinessInfo(Base):
    __tablename__ = "business_info"

    bid = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    business_name = Column(String)
    industry = Column(String)
    country = Column(String)
    business_website = Column(String)
    business_size = Column(String)
    brand_color = Column(String)

class Connectors(Base):
    __tablename__ = "connectors"

    bid = Column(Integer, primary_key=True, index=True)
    insta_api_key = Column(String)
    insta_user_id = Column(String)
    facebook_api_key = Column(String)
    facebook_page_id = Column(String)
    x_api_key = Column(String)
    x_api_key_secret = Column(String)
    x_access_token = Column(String)
    x_access_token_secret = Column(String)
    google_connector_email = Column(String)
    google_api_key = Column(String)
    gmail_access_token = Column(String) # Encrypted
    gmail_refresh_token = Column(String) # Encrypted
    gmail_token_expiry = Column(String)

class UserCredentials(Base):
    __tablename__ = "user_credentials"

    bid = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)

class PostHistory(Base):
    __tablename__ = "post_history"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String) # Storing email here as requested
    image_url = Column(String, nullable=True)
    text = Column(String, nullable=True)
    timestamp = Column(String) # keeping as String for now to match other fields or DateTime if supported, user requested "time stamp". Let's use generic String or import DateTime. The file imports are Column, String, Integer. I should check if DateTime is available or just use String for simplicity as per other models not showing DateTime explicit imports in the view (UserCredentials/BusinessInfo don't have it). Wait, line 1 imports generic types. I will use String for now to be safe or add DateTime import.
    # Actually, user said "time stamp". I'll use String to store ISO format or similar to avoid import errors if not already present, but `func.now()` was in my plan. I need to be careful.
    # The user request showed: "Id, username(email), image , text , time stamp, media used"
    # I'll stick to String for timestamp to match the existing style if no DateTime is imported.
    # Let me check imports again: `from sqlalchemy import Column, String, Integer, ForeignKey`
    # I will add DateTime to imports if I want to use it, but `String` is safer if I don't want to change imports drastically.
    # However, `func.now()` requires `DateTime` usually.
    # User request: "1 explainableproject@gmail.com , {image_url} . text , timestamp , Facebook"
    # I will just use `Column(String)` for timestamp and pass `datetime.utcnow().isoformat()` from python side, or similar.
    media_used = Column(String)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String) # email
    input_message = Column(String) # User Query
    agent_response = Column(String) # AI Response
    image_url = Column(String, nullable=True)
    timestamp = Column(String)
    posted = Column(Boolean, default=False)
