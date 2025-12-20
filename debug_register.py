import requests
import json

url = "http://localhost:8000/register"

payload = {
    "Full_Name": "Debug User",
    "Email": "debug@example.com",
    "Password": "password123",
    "business_name": "Debug Inc",
    "Industry": "Tech",
    "Country": "US",
    "Business_website": "https://example.com",
    "Business_Size": "Solo",
    "Brand_color": "#000000",
    "Insta_API_KEY": "test",
    "Insta_user_id": "test",
    "Facebook_API_KEY": "test",
    "Facebook_page_id": "test",
    "X_api_key": "x_test_key",
    "X_api_key_secret": "x_test_secret",
    "X_access_token": "x_test_token",
    "X_access_token_secret": "x_test_token_secret",
    "Google_connecter_email": "debug@example.com",
    "Google_api_key": "test"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
