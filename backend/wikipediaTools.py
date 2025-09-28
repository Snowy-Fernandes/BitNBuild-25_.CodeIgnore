# wikipediaTools.py
import logging
import requests

logger = logging.getLogger(__name__)

class WikipediaTools:
    def __init__(self):
        self.base_url = "https://en.wikipedia.org/api/rest_v1/page/summary/"
    
    def search(self, query: str, results: int = 3) -> list:
        """Search Wikipedia for articles using REST API"""
        try:
            # Simple search implementation
            return [query]  # Return the query as a placeholder
        except Exception as e:
            logger.error(f"Wikipedia search error: {e}")
            return []
    
    def summary(self, title: str, sentences: int = 2) -> str:
        """Get summary of a Wikipedia article using REST API"""
        try:
            # Simple API call to get summary
            response = requests.get(f"{self.base_url}{title.replace(' ', '_')}")
            if response.status_code == 200:
                data = response.json()
                summary = data.get('extract', '')
                # Limit to approximate number of sentences
                sentences_list = summary.split('.')
                return '.'.join(sentences_list[:sentences]) + '.'
            return f"Summary not available for '{title}'"
        except Exception as e:
            logger.error(f"Wikipedia summary error: {e}")
            return f"Error fetching Wikipedia summary: {str(e)}"