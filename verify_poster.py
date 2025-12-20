
# Verification Script for generate_marketing_poster

import sys
import os

# Ensure Agents directory is in path
sys.path.append(os.path.join(os.getcwd(), 'Agents'))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from Agents.server import generate_marketing_poster
except ImportError:
    # If run from within Agents directory
    from server import generate_marketing_poster

def test_generate_marketing_poster():
    print("Testing generate_marketing_poster...")
    business_name = "TestBusiness"
    prompt = "A futuristic cyber-cafe with neon lights"
    
    result = generate_marketing_poster(business_name, prompt)
    print(f"Result: {result}")
    
    if "https://image.pollinations.ai" in result:
        print("✅ SUCCESS: URL generated correctly.")
    else:
        print("❌ FAILURE: URL not found in result.")

if __name__ == "__main__":
    test_generate_marketing_poster()
