
import asyncio
import os
import sys
import aiohttp
from unittest.mock import MagicMock

# Ensure Agents directory is in path
sys.path.append(os.path.join(os.getcwd(), 'Agents'))

# Mock Groq if needed or run integration test
# Since we want to verify the integration, we'll try to import the actual tools.
# However, async tools need an event loop.

async def verify_tools():
    print("----- Verifying Tools ------")
    
    # Check imports
    try:
        from Agents.server import write_image_prompt, generate_marketing_poster
        print("✅ Imports successful")
    except ImportError:
        print("❌ Import failed. Make sure you are running from the root specific in sys.path")
        return

    # Test 1: Prompt Generation (Mocking Groq because we don't want to burn tokens or wait too long if avoidable, 
    # but for "correctness" verification a live test is better if keys are present. 
    # Let's try live test assuming keys are in .env which server.py loads)
    
    query = "A cyberpunk street vendor selling noodle soup in rain"
    print(f"\n[Test 1] Generating prompt for: '{query}'...")
    
    try:
        detailed_prompt = await write_image_prompt(query, business_name="CyberBites")
        print(f"✅ Generated Prompt: {detailed_prompt}")
    except Exception as e:
        print(f"❌ write_image_prompt failed: {e}")
        detailed_prompt = "Cyberpunk street vendor, neon rain, detailed, 8k" # fallback for next test

    # Test 2: Poster Generation
    print(f"\n[Test 2] Generating poster with prompt...")
    try:
        result = await generate_marketing_poster(detailed_prompt)
        print(f"✅ Result: {result}")
        if "https://image.pollinations.ai" in result:
             print("✅ URL structure valid.")
    except Exception as e:
        print(f"❌ generate_marketing_poster failed: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_tools())
