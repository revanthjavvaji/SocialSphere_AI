import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_repro():
    session = requests.Session()
    
    # 1. Login
    login_data = {"Email": "context_test@example.com", "Password": "password123"}
    resp = session.post(f"{BASE_URL}/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        # Try register just in case db was wiped
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
             "Insta_API_KEY": "", "Insta_user_id": "", "Facebook_API_KEY": "", "Facebook_page_id": "",
            "Linkedin_access_token": "", "Linkedin_Author_URN": "", "Google_connecter_email": "",
            "Google_api_key": "", "Gmail_Access_Token": "", "Gmail_Refresh_Token": "", "Gmail_Token_Expiry": ""
        }
        session.post(f"{BASE_URL}/register", json=reg_data)
        resp = session.post(f"{BASE_URL}/login", json=login_data)
    
    print(f"Login Status: {resp.status_code}")
    
    # 2. Chat (Trigger agent_service.run_query)
    chat_data = {"query": "Hello context test"}
    print("Sending chat request...")
    resp = session.post(f"{BASE_URL}/agent/chat", json=chat_data)
    print(f"Chat Response Code: {resp.status_code}")
    print(f"Chat Response: {resp.text}")

if __name__ == "__main__":
    run_repro()
