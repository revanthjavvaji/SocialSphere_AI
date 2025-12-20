
import asyncio
import os
import sys
from unittest.mock import MagicMock, patch

sys.path.append(os.path.join(os.getcwd(), 'Agents'))

async def verify_logging():
    print("----- Verifying Logging Logic ------")
    
    try:
        # Mock database session to avoid writing to real DB and to verify logic path
        with patch('Agents.server.SessionLocal') as mock_session_cls:
            mock_session = MagicMock()
            mock_session_cls.return_value = mock_session
            
            # Mock query result
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_session.query.return_value.filter.return_value.first.return_value = mock_user

            from Agents.server import generate_marketing_poster
            
            prompt = "A verified database logging test poster"
            bid = 123
            
            print(f"[Test] Calling generate_marketing_poster with bid={bid}...")
            # Mock aiohttp to avoid real network call (we tested that already)
            with patch('aiohttp.ClientSession.get') as mock_get:
                mock_resp = MagicMock()
                mock_resp.status = 200
                mock_get.return_value.__aenter__.return_value = mock_resp
                
                result = await generate_marketing_poster(prompt, bid)
                
            print(f"✅ Result: {result}")
            
            # Verify DB interactions
            mock_session.add.assert_called_once()
            added_obj = mock_session.add.call_args[0][0]
            print(f"✅ Added object to DB: {added_obj}")
            print(f"   - Type: {type(added_obj)}")
            print(f"   - Username: {added_obj.username}")
            print(f"   - Input: {added_obj.input_message}")
            if hasattr(added_obj, 'image_url'):
                 print(f"   - Image URL: {added_obj.image_url}")
            
            mock_session.commit.assert_called_once()
            print("✅ DB Commit called.")

    except ImportError:
        print("❌ Could not import server. Run from correct root.")
    except Exception as e:
        print(f"❌ Verification failed: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_logging())
