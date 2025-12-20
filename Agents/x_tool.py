import os
from pathlib import Path
from typing import Optional

import tweepy
from dotenv import load_dotenv
from PIL import Image


def post_to_x(text: Optional[str] = None, image_path: Optional[str] = None):
    """
    Post text, image, or text+image to X.
    Reads credentials from .env and performs full verification.
    """

    # -------------------------------------------------
    # 1. Load and verify environment variables
    # -------------------------------------------------
    load_dotenv()

    required_vars = [
        "X_API_KEY",
        "X_API_KEY_SECRET",
        "X_ACCESS_TOKEN",
        "X_ACCESS_TOKEN_SECRET",
    ]

    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    # -------------------------------------------------
    # 2. Validate inputs
    # -------------------------------------------------
    if not text and not image_path:
        raise ValueError("At least one of text or image_path must be provided.")

    if text:
        if not isinstance(text, str):
            raise TypeError("Text must be a string.")
        if len(text) > 280:
            raise ValueError("Text exceeds X character limit (280).")

    media_ids = None

    if image_path:
        path = Path(image_path)

        if not path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            raise ValueError("Unsupported image format.")

        try:
            with Image.open(path) as img:
                img.verify()
        except Exception:
            raise ValueError("Invalid or corrupted image file.")

    # -------------------------------------------------
    # 3. Authenticate with X
    # -------------------------------------------------
    client = tweepy.Client(
        consumer_key=os.getenv("X_API_KEY"),
        consumer_secret=os.getenv("X_API_KEY_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET"),
    )

    # Media upload still requires OAuth1
    auth = tweepy.OAuth1UserHandler(
        os.getenv("X_API_KEY"),
        os.getenv("X_API_KEY_SECRET"),
        os.getenv("X_ACCESS_TOKEN"),
        os.getenv("X_ACCESS_TOKEN_SECRET"),
    )
    api = tweepy.API(auth)

    # -------------------------------------------------
    # 4. Upload image if provided
    # -------------------------------------------------
    if image_path:
        media = api.media_upload(filename=image_path)
        media_ids = [media.media_id]

    # -------------------------------------------------
    # 5. Create post
    # -------------------------------------------------
    response = client.create_tweet(
        text=text if text else None,
        media_ids=media_ids,
    )

    return {
        "status": "success",
        "tweet_id": response.data["id"],
        "tweet_url": f"https://x.com/user/status/{response.data['id']}",
    }


# -------------------------------------------------
# Example direct execution
# -------------------------------------------------
if __name__ == "__main__":
    result = post_to_x(
        text= None ,#"Posting from a single-function Python tool jagguji🚀",
        image_path="/Users/abhirambussa/Desktop/Hackathon/SocialSphere_AI/monkey.jpg"
    )
    print(result)
