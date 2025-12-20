
import sys
import os
try:
    from mcp_use import MCPAgent
    import inspect
    
    print("--- MCPAgent Inspection ---")
    print(f"Run signature: {inspect.signature(MCPAgent.run)}")
    print(f"Init signature: {inspect.signature(MCPAgent.__init__)}")
    
except ImportError:
    print("Could not import mcp_use")
except Exception as e:
    print(f"Error: {e}")
