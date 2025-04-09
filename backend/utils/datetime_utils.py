from datetime import datetime
from typing import Optional, Union

def safe_fromisoformat(date_str: Optional[Union[str, bytes, int, float]]) -> Optional[datetime]:
    """
    Safely convert an ISO format date string to datetime, handling None values and type errors.
    
    Args:
        date_str: Date string in ISO format, or None/other type that needs to be handled safely
        
    Returns:
        datetime object or None if parsing fails
    """
    if date_str is None:
        return None
    
    try:
        # Convert to string if it's not already
        if not isinstance(date_str, str):
            date_str = str(date_str)
        
        # Parse the ISO format date string
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        # Handle invalid format or type errors
        return None
