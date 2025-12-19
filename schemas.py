from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    Full_Name: str
    Email: str
    Password: str
    business_name: Optional[str] = None
    Industry: Optional[str] = None
    Country: Optional[str] = None
    Business_website: Optional[str] = None
    Business_Size: Optional[str] = None
    Brand_color: Optional[str] = None
    Insta_API_KEY: Optional[str] = None
    Insta_user_id: Optional[str] = None
    Facebook_API_KEY: Optional[str] = None
    Facebook_page_id: Optional[str] = None
    Linkedin_access_token: Optional[str] = None
    Linkedin_Author_URN: Optional[str] = None
    Google_connecter_email: Optional[str] = None
    Google_api_key: Optional[str] = None
    Gmail_Access_Token: Optional[str] = None
    Gmail_Refresh_Token: Optional[str] = None
    Gmail_Token_Expiry: Optional[str] = None

class UserLogin(BaseModel):
    Email: str
    Password: str
