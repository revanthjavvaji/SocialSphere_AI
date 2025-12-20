import base64
import os
import mimetypes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
from database import SessionLocal
import gmail_utils

def send_email(
    bid: int,
    recipient: str,
    subject: str,
    body: str,
    image_path: Optional[str] = None
) -> str:
    """
    Sends an email using Gmail API with OAuth credentials stored in the database.
    
    Args:
        bid: Business ID to retrieve correct OAuth tokens.
        recipient: Receiver email address.
        subject: Email subject.
        body: Email body content.
        image_path: Optional path to an attachment.
        
    Returns:
        Status message string.
    """
    db = SessionLocal()
    try:
        # Get authenticated service for this business
        # This handles token decryption and refresh automatically
        service = gmail_utils.get_gmail_service(bid, db)
        
        msg = MIMEMultipart()
        msg['To'] = recipient
        msg['Subject'] = subject
        # 'From' header is set by Gmail based on the authenticated user ("me")
        
        msg.attach(MIMEText(body, 'plain'))
        
        if image_path and os.path.exists(image_path):
            content_type, encoding = mimetypes.guess_type(image_path)
            if content_type is None or encoding is not None:
                # No guess could be made, or the file is encoded (compressed), so
                # use a generic bag-of-bits type.
                content_type = 'application/octet-stream'
            
            main_type, sub_type = content_type.split('/', 1)
            
            try:
                with open(image_path, 'rb') as fp:
                    msg_img = MIMEBase(main_type, sub_type)
                    msg_img.set_payload(fp.read())
                
                encoders.encode_base64(msg_img)
                msg_img.add_header('Content-Disposition', 'attachment', filename=os.path.basename(image_path))
                msg.attach(msg_img)
            except Exception as img_err:
                 print(f"Warning: Failed to attach image {image_path}: {img_err}")
                 # Continue sending without image? Or fail? 
                 # Usually better to fail or notify. I'll append to body.
                 msg.attach(MIMEText(f"\n[Error attaching image: {img_err}]", 'plain'))

        # Encode the message
        raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        body_payload = {'raw': raw_msg}
        
        # Send
        sent_message = service.users().messages().send(userId="me", body=body_payload).execute()
        return f"Email sent successfully! Message ID: {sent_message['id']}"

    except Exception as e:
        return f"Failed to send email: {e}"
    finally:
        db.close()

if __name__ == "__main__":
    # Test Block
    # TO TEST: Change the BID below to a valid Business ID in your database that has connected Gmail.
    print("--- Testing OAuth Gmail Sender ---")
    
    test_bid = 1  # Replace with a valid BID from your DB
    test_recipient = "test@example.com" # Replace with your email to verify
    
    # Uncomment to run test
    # result = send_email(
    #     bid=test_bid, 
    #     recipient=test_recipient, 
    #     subject="Test via OAuth Python", 
    #     body="This is a test email using the refactored OAuth sender.",
    #     image_path=None
    # )
    # print(result)
