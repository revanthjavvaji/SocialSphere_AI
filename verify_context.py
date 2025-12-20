from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette.middleware.sessions import SessionMiddleware
from app_context import set_bid, get_bid


# 1. Create a dummy module function to simulate external access
def external_module_function():
    return get_bid()

# 2. Setup minimal app
app = FastAPI()

# Add the Context Middleware (SAME LOGIC AS main.py)
@app.middleware("http")
async def set_bid_context_middleware(request: Request, call_next):
    # Retrieve 'bid' from session - for test we will simulate this or set it manually
    # In a real request, session is decoded from cookie. 
    # Here, we might need a workaround to inject session data for the test since we can't easily sign cookies manually without the secret.
    
    # WORKAROUND FOR TEST: 
    # Use a custom header to simulate "session data" just for this middleware verification
    # OR, rely on TestClient's cookie handling if we have a login endpoint.
    
    # Let's assume the session has it. 
    # For testing purposes, we'll try to set it from a header if session is empty (just to prove the context var logic works)
    
    bid = request.session.get("bid")
    
    # DEBUG override for testing without real session cookie generation
    if not bid and request.headers.get("X-Test-Bid"):
        bid = int(request.headers.get("X-Test-Bid"))
        # Populate session for consistency if needed, but context var is the goal
    
    if bid:
        set_bid(bid)
    
    response = await call_next(request)
    return response

# Add Session Middleware (needed for request.session)
# Must be added AFTER (wrapping) the context middleware so it runs FIRST on the request
app.add_middleware(SessionMiddleware, secret_key="test-secret")

@app.get("/test-context")
def test_endpoint():
    # Call the external function to see if it grabs the context
    val = external_module_function()
    return {"bid_from_context": val}

client = TestClient(app)

def test_context_flow():
    # 1. Request WITH bid
    response = client.get("/test-context", headers={"X-Test-Bid": "123"})
    data = response.json()
    print(f"Response with BID 123: {data}")
    assert data["bid_from_context"] == 123

    # 2. Request WITHOUT bid
    response = client.get("/test-context")
    data = response.json()
    print(f"Response without BID: {data}")
    assert data["bid_from_context"] is None

if __name__ == "__main__":
    try:
        test_context_flow()
        print("✅ Verification Successful: ContextVar correctly propagates BID!")
    except AssertionError as e:
        print(f"❌ Verification Failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
