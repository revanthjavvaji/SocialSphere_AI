
import urllib.parse

def generate_marketing_poster(business_name: str, prompt: str) -> str:
    """
    Generates a high-quality marketing poster image.
    Returns the URL of the generated image.
    """
    # 1. Enhance the prompt for better marketing results
    enhanced_prompt = f"Professional marketing poster for {business_name}, {prompt}, high quality, 4k, trendy design, clean layout"
    
    # 2. URL Encode the prompt
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    
    # 3. Construct the Pollinations URL (No API Key needed)
    # Using 'flux' model for better text and quality
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&model=flux&nologo=true"
    
    # In a demo, you can just return the URL for the frontend to display
    return f"Poster generated successfully! View it here: {image_url}"

if __name__ == "__main__":
    print("Testing generate_marketing_poster logic...")
    business_name = "Zenith Coffee"
    prompt = "A cozy rainy day atmosphere"
    result = generate_marketing_poster(business_name, prompt)
    print(f"Result: {result}")
    
    expected_url_part = "https://image.pollinations.ai/prompt/"
    if expected_url_part in result:
         # Optional: Check if URL works
        import requests
        try:
            url = result.split("View it here: ")[1]
            print(f"Checking URL: {url}")
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                print("✅ SUCCESS: URL generated and is reachable (Image generated).")
            else:
                print(f"⚠️ URL generated but returned status {resp.status_code}.")
        except Exception as e:
            print(f"⚠️ URL verification failed: {e}")
    else:
        print("❌ FAILURE: URL not found in result.")
