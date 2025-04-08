# ###################################################################################################
# Arquivo: api_client.py                                                                            #
# Descrição: Cliente para realizar requisições à API real de produtos                               #
# Autor: Jean Rosso                                                                                 #
# Data: 7 de abril de 2025                                                                          #
# ###################################################################################################

import os
import json
import requests
from urllib.parse import urljoin
import logging
from requests.exceptions import RequestException
from backend.utils.cache import cache_response, get_cached_response

# Configure logger
logger = logging.getLogger(__name__)

def load_config():
    """Load API configuration from JSON file"""
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "api_config.json")
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load API config: {str(e)}")
        raise RuntimeError(f"Critical error: Unable to load API configuration: {str(e)}")

def get_api_headers():
    """Get headers for API requests including authentication"""
    config = load_config()
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    # Add API key if available
    api_key = config.get("API_KEY")
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'
        
    return headers

def get_products_from_api(sort_by="most-sold"):
    """Fetch products from the real Shopee API endpoint with sorting options"""
    config = load_config()
    
    # Create cache key based on parameters
    cache_key = f"products_sort_{sort_by}"
    
    # Check cache if enabled
    if config.get("ENABLE_CACHING", False):
        cached_data = get_cached_response(cache_key)
        if cached_data:
            logger.info("Returning cached product data")
            return cached_data
    
    try:
        # Get Shopee API client
        shopee_client = get_shopee_api_client()
        
        # Map sorting option to Shopee API sort_type
        # According to Shopee API: 
        # 1 = relevance, 2 = sales, 3 = discount, 4 = price low to high, 5 = price high to low
        sort_type = 2  # Default to sales (most-sold)
        if sort_by == "highest-discount":
            sort_type = 3
        
        # Get product offers from Shopee API with sorting
        result = shopee_client.get_offer_list(limit=100, sort_type=sort_type)
        
        if 'data' not in result or 'productOffer' not in result['data']:
            logger.error("Invalid response format from Shopee API")
            raise ValueError("Invalid response format from Shopee API")
        
        product_nodes = result['data']['productOffer']['nodes']
        
        # Transform to our standard format
        formatted_products = [{
            'id': product.get('itemId'),
            'name': product.get('productName'),
            'price': product.get('priceMin'),
            'imageUrl': product.get('imageUrl'),
            'sales': product.get('sales', 0),
            'commission': product.get('commissionRate', 0),
            'discount': product.get('priceDiscountRate', 0),
            'shopName': product.get('shopName'),
            'productUrl': product.get('productLink'),
            'affiliateLink': product.get('offerLink')
        } for product in product_nodes]
        
        response_data = {'data': formatted_products}
        
        # Cache response if enabled
        if config.get("ENABLE_CACHING", False):
            cache_duration = config.get("CACHE_DURATION", 300)  # Default 5 minutes
            cache_response(cache_key, response_data, cache_duration)
            
        return response_data
    
    except Exception as e:
        logger.error(f"API request failed: {str(e)}")
        raise

def get_categories_from_api():
    """Fetch categories from the real API endpoint"""
    config = load_config()
    api_url = config.get("API_BASE_URL")
    
    # Create cache key
    cache_key = "categories"
    
    # Check cache if enabled
    if config.get("ENABLE_CACHING", False):
        cached_data = get_cached_response(cache_key)
        if cached_data:
            logger.info("Returning cached category data")
            return cached_data
    
    try:
        url = urljoin(api_url, "categories")
        
        logger.info(f"Making API request to {url}")
        
        response = requests.get(
            url, 
            headers=get_api_headers(),
            timeout=config.get("API_TIMEOUT", 30)
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Cache response if enabled
        if config.get("ENABLE_CACHING", False):
            cache_duration = config.get("CACHE_DURATION", 300)
            cache_response(cache_key, data, cache_duration)
            
        return data
    except RequestException as e:
        logger.error(f"API request for categories failed: {str(e)}")
        raise
