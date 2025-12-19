from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

# Load encryption key from environment variable or generate a new one (for dev/demo purposes)
# In production, this MUST be a persistent environment variable.
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Generate a key if not present (Not recommended for production restart persistence)
    # Ideally, print this and tell user to add it to .env
    key = Fernet.generate_key()
    ENCRYPTION_KEY = key.decode()
    print(f"WARNING: ENCRYPTION_KEY not found in .env. Generated temporary key: {ENCRYPTION_KEY}")

cipher_suite = Fernet(ENCRYPTION_KEY.encode())

def encrypt_token(token: str) -> str:
    """Encrypts a token string."""
    if not token:
        return None
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts an encrypted token string."""
    if not encrypted_token:
        return None
    try:
        return cipher_suite.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return None
