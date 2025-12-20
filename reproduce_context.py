import requests
import json

BASE_URL = "http://localhost:8000"

def run_repro():
    session = requests.Session()
    
    # 1. Login (Assuming user exists from previous runs, else we'd register)
    # We'll try logging in as the user we created before 'context_test@example.com'.
    login_data = {"Email": "context_test@example.com", "Password": "password123"}
    
    print("Attempting login...")
    resp = session.post(f"{BASE_URL}/login", json=login_data)
    print(f"Login Status: {resp.status_code}")
    
    # If login fails, try to register
    if resp.status_code != 200:
        print("Login failed, attempting register...")
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
        resp = session.post(f"{BASE_URL}/register", json=reg_data)
        print(f"Register Status: {resp.status_code}")
        
        # Login again
        resp = session.post(f"{BASE_URL}/login", json=login_data)
        print(f"Login Status after register: {resp.status_code}")

    print("Logged in. Cookies:", session.cookies.get_dict())
    
    # 2. Check Context
    print("Checking debug context...")
    resp = session.get(f"{BASE_URL}/debug/context")
    print(f"Debug Context Status: {resp.status_code}")
    print(f"Debug Context Response: {resp.text}")

if __name__ == "__main__":
    run_repro()
