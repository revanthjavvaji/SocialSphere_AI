from sqlalchemy import Column, String, Integer, ForeignKey
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
    linkedin_access_token = Column(String)
    linkedin_author_urn = Column(String)
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
