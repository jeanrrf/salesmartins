# ###################################################################################################
# Arquivo: cache.py                                                                                 #
# Descrição: Utilitários para caching de respostas da API                                          #
# Autor: Jean Rosso                                                                                #
# Data: 7 de abril de 2025                                                                          #
# ###################################################################################################

import time
import json
import logging

# In-memory cache store
_cache = {}
logger = logging.getLogger(__name__)

def cache_response(key, data, duration=300):
    """
    Store response data in cache
    
    Args:
        key: Cache key
        data: Data to cache
        duration: Cache duration in seconds (default 5 minutes)
    """
    expiry = time.time() + duration
    _cache[key] = {
        'data': data,
        'expiry': expiry
    }
    logger.debug(f"Cached data with key '{key}' for {duration} seconds")

def get_cached_response(key):
    """
    Get response data from cache if not expired
    
    Args:
        key: Cache key
        
    Returns:
        Cached data or None if expired or not found
    """
    if key not in _cache:
        return None
        
    cache_item = _cache[key]
    current_time = time.time()
    
    # Check if cached data is still valid
    if current_time > cache_item['expiry']:
        # Remove expired data
        del _cache[key]
        logger.debug(f"Cache expired for key '{key}'")
        return None
        
    logger.debug(f"Cache hit for key '{key}'")
    return cache_item['data']
    
def clear_cache(pattern=None):
    """
    Clear cache entries
    
    Args:
        pattern: If provided, only clear entries matching this pattern
    """
    global _cache
    
    if pattern is None:
        # Clear all cache
        _cache = {}
        logger.debug("Cleared entire cache")
        return
        
    # Clear only keys matching the pattern
    keys_to_delete = []
    
    for key in _cache.keys():
        if isinstance(pattern, str) and pattern in key:
            keys_to_delete.append(key)
        elif hasattr(pattern, 'match') and pattern.match(key):
            keys_to_delete.append(key)
            
    for key in keys_to_delete:
        del _cache[key]
    
    if keys_to_delete:
        logger.debug(f"Cleared {len(keys_to_delete)} cache entries matching pattern")
