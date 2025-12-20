import sys
import os

print("Testing server.py import...")
try:
    import Agents.server
    print("✅ Successfully imported Agents.server")
except ImportError as e:
    print(f"❌ Import failed: {e}")
except Exception as e:
    print(f"❌ Error during import: {e}")
