
import sys
import os
import asyncio
from app_context import set_bid

# Add cwd
sys.path.insert(0, os.getcwd())

from Agents.agent_service import agent_service

async def test():
    # 1. Set context
    print("Setting BID to 999...")
    set_bid(999)
    
    # 2. Check internal access
    val = await agent_service.debug_get_bid()
    print(f"AgentService.debug_get_bid() returned: {val}")
    
    if val == 999:
        print("✅ SUCCESS: AgentService sees the context.")
    else:
        print("❌ FAILURE: AgentService does NOT see the context.")

if __name__ == "__main__":
    asyncio.run(test())
