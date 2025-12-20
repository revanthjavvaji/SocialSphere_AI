
import sys
import os

# Add cwd to path to mimic uvicorn behavior
sys.path.insert(0, os.getcwd())

import app_context
from Agents import agent_service

def test():
    print(f"app_context file: {app_context.__file__}")
    print(f"agent_service imported get_bid from: {agent_service.get_bid.__module__}")
    
    # Check if they match
    module_name = agent_service.get_bid.__module__
    actual_module = sys.modules[module_name]
    
    print(f"app_context object: {app_context}")
    print(f"sys.modules['{module_name}']: {actual_module}")
    
    if app_context == actual_module:
        print("✅ Modules are identical.")
    else:
        print("❌ Modules are DIFFERENT (ContextVar will fail).")
        
    # access private _bid_context to be 100% sure
    id1 = id(app_context._bid_context)
    # We can't easily access it from get_bid closure, but we can inspect the module
    id2 = id(actual_module._bid_context)
    
    print(f"ID in main: {id1}")
    print(f"ID in agent_service dependency: {id2}")
    
    if id1 == id2:
        print("✅ ContextVar IDs match.")
    else:
        print("❌ ContextVar IDs DO NOT match.")

if __name__ == "__main__":
    test()
