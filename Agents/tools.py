import requests
import time
import os
from dotenv import load_dotenv
from langchain.tools import tool
from RAG.tools import search_social_sphere_context as rag_search_tool

# Load .env explicitly from the Agents directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

@tool
def post_with_system_user(message: str, page_id: str = None, system_token: str = None) -> str:
    """
    Post a message to a Facebook Page using a System User token.
    Reads page_id and system_token from Agents/.env if not provided.
    """
    # Strict fallback to .env
    page_id = page_id or os.getenv("FACEBOOK_PAGE_ID")
    system_token = system_token or os.getenv("SYSTEM_TOKEN")

    if not page_id or not system_token:
        return "❌ Error: Missing 'FACEBOOK_PAGE_ID' or 'SYSTEM_TOKEN' in Agents/.env or arguments."

    # Step 1: Simple Validation (Check if the Page exists and is reachable)
    val_url = f"https://graph.facebook.com/v20.0/{page_id}"
    val_params = {"fields": "name", "access_token": system_token}
    
    val_res = requests.get(val_url, params=val_params).json()
    
    if "error" in val_res:
        error_msg = f"❌ Validation Failed: {val_res['error']['message']}"
        print(error_msg)
        return error_msg

    print(f"✅ Token verified for: {val_res.get('name')}")

    # Step 2: Publish to Page Feed
    post_url = f"https://graph.facebook.com/v20.0/{page_id}/feed"
    payload = {
        'message': message,
        'access_token': system_token
    }

    response = requests.post(post_url, data=payload)
    result = response.json()
    
    if response.status_code == 200:
        success_msg = f"🚀 Successfully Published! Post ID: {result.get('id')}"
        print(success_msg)
        return success_msg
    else:
        error_msg = f"❌ Post Failed: {result}"
        print(error_msg)
        if result.get('error', {}).get('code') == 200:
            advice = "💡 REASON: You must go to Business Settings > System Users > Add Assets and grant 'Full Control' for this Page."
            print(advice)
            return f"{error_msg}\n{advice}"
        return error_msg

@tool
def post_to_instagram(image_url: str, caption: str, ig_id: str = None, token: str = None) -> str:
    """
    Post an image to Instagram Business account.
    Reads ig_id and token from Agents/.env if not provided.
    """
    # Strict fallback to .env
    ig_id = ig_id or os.getenv("IG_BUSINESS_ID")
    token = token or os.getenv("SYSTEM_TOKEN")

    if not ig_id or not token:
        return "❌ Error: Missing 'IG_BUSINESS_ID' or 'SYSTEM_TOKEN' in Agents/.env or arguments."

    # STEP 1: Create the Media Container
    container_url = f"https://graph.facebook.com/v20.0/{ig_id}/media"
    payload = {
        'image_url': image_url,
        'caption': caption,
        'access_token': token
    }
    
    response = requests.post(container_url, data=payload)
    res_data = response.json()
    
    if "id" not in res_data:
        error_msg = f"❌ Container Error: {res_data}"
        print(error_msg)
        return error_msg

    creation_id = res_data["id"]
    print(f"✅ Container created. ID: {creation_id}")

    # STEP 2: Wait for processing
    print("Waiting 10 seconds for Instagram to process the image...")
    time.sleep(10)

    # STEP 3: Publish the Container
    publish_url = f"https://graph.facebook.com/v20.0/{ig_id}/media_publish"
    publish_payload = {
        'creation_id': creation_id,
        'access_token': token
    }
    
    publish_res = requests.post(publish_url, data=publish_payload)
    if publish_res.status_code == 200:
        success_msg = f"🚀 Successfully posted to Instagram! ID: {publish_res.json().get('id')}"
        print(success_msg)
        return success_msg
    else:
        error_msg = f"❌ Publish Failed: {publish_res.json()}"
        print(error_msg)
        return error_msg

@tool
def search_social_sphere_context(query: str, bid: int = None) -> str:
    """
    Searches SocialSphere context for relevant information.
    Uses 'BUSINESS_ID' from Agents/.env if bid is not provided.
    """
    bid_env = os.getenv("BUSINESS_ID")
    if bid is None and bid_env:
        try:
            bid = int(bid_env)
        except ValueError:
            return f"❌ Error: 'BUSINESS_ID' in .env is not a valid integer: {bid_env}"
            
    if bid is None:
        return "❌ Error: Missing 'bid'. Provide it as an argument or set 'BUSINESS_ID' in Agents/.env."
        
    return rag_search_tool(bid=bid, query=query)
