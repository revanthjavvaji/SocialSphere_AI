import os
import base64
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import models
from auth_utils import decrypt_token
from langchain_groq import ChatGroq

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

from dotenv import load_dotenv
load_dotenv()

def get_gmail_credentials(bid: int, db: Session):
    """Retrieves and decrypts Gmail credentials for a given business ID."""
    connector = db.query(models.Connectors).filter(models.Connectors.bid == bid).first()
    
    if not connector or not connector.gmail_access_token:
        raise Exception(f"No Gmail connection found for business ID {bid}")

    print(f"DEBUG: DB Fetch - Encrypted Refresh Token: {connector.gmail_refresh_token[:20] if connector.gmail_refresh_token else 'None'}")
    
    access_token = decrypt_token(connector.gmail_access_token)
    refresh_token = decrypt_token(connector.gmail_refresh_token) if connector.gmail_refresh_token else None
    
    print(f"DEBUG: Decrypted Refresh Token: {bool(refresh_token)}")
    
    client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise Exception("Google Client ID or Secret not found in environment variables.")

    # Debug print
    print(f"Loading creds: ClientID={client_id[:10]}..., RefreshToken={refresh_token[:10] if refresh_token else 'None'}")

    # Construct Credentials object
    # Important: 'token_uri' is required to refresh access tokens
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES
    )
    return creds

def get_gmail_service(bid: int, db: Session):
    """Builds and returns the Gmail API service."""
    creds = get_gmail_credentials(bid, db)
    return build("gmail", "v1", credentials=creds)

def decode_body(payload):
    """Recursively extracts and decodes email body."""
    body = ""
    if "parts" in payload:
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain":
                data = part["body"].get("data")
                if data:
                    body += base64.urlsafe_b64decode(data).decode()
            elif "parts" in part:
                 # Recursive check for nested parts
                body += decode_body(part)
    elif "body" in payload:
        data = payload["body"].get("data")
        if data:
            body += base64.urlsafe_b64decode(data).decode()
    return body

def get_header(headers, name):
    """Extracts a specific header value."""
    return next((h["value"] for h in headers if h["name"] == name), "N/A")

def fetch_todays_emails(bid: int, db: Session):
    """Fetches all emails received today."""
    try:
        service = get_gmail_service(bid, db)
        
        # Calculate start of today (local time assumption or UTC? Gmail uses seconds since epoch)
        # Using 'after:YYYY/MM/DD' is robust for Gmail search queries
        today = datetime.now().strftime("%Y/%m/%d")
        query = f"after:{today}" 
        
        results = service.users().messages().list(
            userId="me",
            q=query,
            labelIds=["INBOX"]
        ).execute()

        messages = results.get("messages", [])
        email_data = []

        if not messages:
            return []

        for msg in messages:
            msg_detail = service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="full"
            ).execute()

            payload = msg_detail["payload"]
            headers = payload.get("headers", [])
            
            subject = get_header(headers, "Subject")
            sender = get_header(headers, "From")
            date = get_header(headers, "Date")
            body = decode_body(payload)

            email_data.append({
                "id": msg["id"],
                "subject": subject,
                "from": sender,
                "date": date,
                "body": body
            })
            
        return email_data

    except Exception as e:
        print(f"Error fetching emails: {e}")
        raise e

from langchain_groq import ChatGroq

def get_groq_llm():
    """Initializes Groq LLM."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Warning: GROQ_API_KEY not found.")
        return None
    return ChatGroq(groq_api_key=api_key, model_name="openai/gpt-oss-120b")

def summarize_emails_with_groq(email_text_blob: str):
    """Summarizes email text using Groq."""
    llm = get_groq_llm()
    if not llm:
        return "LLM not initialized."

    prompt = f"""
You are an AI assistant that reads raw email text and extracts ONLY important, actionable events.

Your task:
1. Identify if the email contains any important event, deadline, meeting, reminder, payment, delivery, appointment, interview, exam, travel, or time-sensitive action.
2. If no important event exists, respond with exactly:
   "No important event found."

If an important event exists:
- Summarize it in **1–2 short sentences**
- Use **clear, simple language**
- Include **WHAT happened**, **WHEN**, and **ACTION REQUIRED** (if any)
- Avoid greetings, signatures, disclaimers, and filler words
- Do NOT exceed **25 words**
- Make it suitable for a **mobile notification**

Output format (strict):
Event: <short summary>

Input Email Text:
{email_text_blob}
"""
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        print(f"Groq Error: {e}")
        return "Error generating summary."

def fetch_todays_emails_and_summarize(bid: int, db: Session):
    """Fetches emails and generates a summary."""
    emails = fetch_todays_emails(bid, db)
    
    # Sort by date desc (latest first) and take top 10
    recent_emails = emails[:10]
    
    if not recent_emails:
        return {"count": 0, "emails": [], "summary": "No emails found today."}

    # Concatenate texts
    full_text = ""
    for email in recent_emails:
        full_text += f"\n--- Email from {email['from']} (Subject: {email['subject']}) ---\n{email['body']}\n"
        #print(full_text)
    
    summary = summarize_emails_with_groq(full_text)
    
    return {
        "count": len(emails),
        "recent_count": len(recent_emails),
        "emails": recent_emails,
        "summary": summary
    }
