class ShopeeApiClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key

    def execute_query(self, query: str, variables: Dict) -> Dict:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        response = requests.post(self.api_url, json={"query": query, "variables": variables}, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_offer_list(self, limit: int = 500, scroll_id: Optional[str] = None, sort_type: int = 2) -> Dict:
        """
        Obtém a lista de ofertas da Shopee
        
        Args:
            limit: Limite de itens por página (max 500)
            scroll_id: ID de paginação (para páginas após a primeira)
            sort_type: Tipo de ordenação (1=relevance, 2=sales, 3=discount, 4=price low to high, 5=price high to low)
            
        Returns:
            Lista de ofertas e scrollId para paginação
        """
        variables = {"limit": min(limit, 500), "sortType": sort_type}
        
        if scroll_id:
            variables["scrollId"] = scroll_id
        
        query = """
        query getOfferList($limit: Int!, $scrollId: String, $sortType: Int) {
          productOffer(limit: $limit, scrollId: $scrollId, sortType: $sortType) {
            nodes {
              itemId
              productName
              commissionRate
              sales
              priceMin
              priceMax
              priceDiscountRate
              imageUrl
              shopName
              productLink
              offerLink
            }
            pageInfo {
              hasNextPage
              scrollId
            }
          }
        }
        """
        
        result = self.execute_query(query, variables)
        return result