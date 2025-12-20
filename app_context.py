from contextvars import ContextVar
from typing import Optional

# Define the ContextVar with a default value of None
_bid_context: ContextVar[Optional[int]] = ContextVar("bid_context", default=None)

def set_bid(bid: int):
    """Sets the business ID for the current context."""
    # print(f"DEBUG: app_context.set_bid({bid}) - ContextVar ID: {id(_bid_context)}")
    _bid_context.set(bid)

def get_bid() -> Optional[int]:
    """Retrieves the business ID from the current context."""
    val = _bid_context.get()
    # print(f"DEBUG: app_context.get_bid() -> {val} - ContextVar ID: {id(_bid_context)}")
    return val
