import requests
import json

BASE_URL = "http://localhost:8000"

def run_repro():
    session = requests.Session()
    
    # 1. Register
    reg_data = {
        "Full_Name": "Context Test User",
        "business_name": "Context Test Biz",
        "Industry": "Tech",
        "Country": "US",
        "Business_website": "example.com",
        "Business_Size": "Small",
        "Brand_color": "Blue",
        "Email": "context_test@example.com",
        "Password": "password123",
        # Optional fields
        "Insta_API_KEY": "", "Insta_user_id": "", "Facebook_API_KEY": "", "Facebook_page_id": "",
        "Linkedin_access_token": "", "Linkedin_Author_URN": "", "Google_connecter_email": "",
        "Google_api_key": "", "Gmail_Access_Token": "", "Gmail_Refresh_Token": "", "Gmail_Token_Expiry": ""
    }
    
    # Try register, if fails maybe user exists
    try:
        resp = session.post(f"{BASE_URL}/register", json=reg_data)
        print(f"Register Status: {resp.status_code}")
    except Exception as e:
        print(f"Register failed (maybe server not up?): {e}")
        return

    # 2. Login
    login_data = {"Email": "context_test@example.com", "Password": "password123"}
    resp = session.post(f"{BASE_URL}/login", json=login_data)
    print(f"Login Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Login Response: {resp.text}")
        return

    print("Logged in. Cookies:", session.cookies.get_dict())
    
    # 3. Chat with Agent
    chat_data = {"query": "What is my business ID?"}
    resp = session.post(f"{BASE_URL}/agent/chat", json=chat_data)
    print(f"Chat Status: {resp.status_code}")
    print(f"Chat Response: {resp.text}")

if __name__ == "__main__":
    run_repro()
