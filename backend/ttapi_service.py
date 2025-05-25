import requests
import time
import asyncio
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TTAPI_ENDPOINT = 'http://localhost:5001/api'  # או כתובת אחרת של השרת שלך

class TTAPIService:
    def __init__(self, base_url: str = TTAPI_ENDPOINT):
        """
        Initialize the TTAPI Service
        
        Args:
            base_url (str): Base URL for the TTAPI endpoint
        """
        self.base_url = base_url
        self.timeout = 30  # 30 seconds timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def create_image_request(self, answers: Dict[str, Any], prompt: str) -> Dict[str, Any]:
        """
        שולח בקשה ליצירת תמונה ומחזיר את מזהה הבקשה
        
        Args:
            answers (Dict): תשובות המשתמש מהשאלון
            prompt (str): הפרומפט ליצירת התמונה
            
        Returns:
            Dict: מחזיר את התשובה מהשרת כולל requestId
            
        Raises:
            requests.RequestException: If the request fails
        """
        try:
            url = f"{self.base_url}/create-image"
            data = {
                'answers': answers,
                'prompt': prompt
            }
            
            response = self.session.post(url, json=data, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"✅ Image request created: {result}")
            return result  # אמור לכלול requestId
            
        except requests.RequestException as error:
            logger.error(f"❌ Error creating image request: {error}")
            raise error

    def check_image_status(self, request_id: str) -> Dict[str, Any]:
        """
        בודק את סטטוס הבקשה לפי מזהה
        
        Args:
            request_id (str): מזהה הבקשה
            
        Returns:
            Dict: מחזיר את סטטוס הבקשה והקישור לתמונה אם היא מוכנה
            
        Raises:
            requests.RequestException: If the request fails
        """
        try:
            url = f"{self.base_url}/check-status/{request_id}"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"✅ Image status checked: {result}")
            return result  # צפוי להכיל status ו-imageUrl אם מוכן
            
        except requests.RequestException as error:
            logger.error(f"❌ Error checking image status: {error}")
            raise error

    def get_image_if_ready(self, request_id: str) -> Optional[str]:
        """
        מחזיר את התמונה המוכנה אם קיימת
        
        Args:
            request_id (str): מזהה הבקשה
            
        Returns:
            Optional[str]: מחזיר את כתובת ה-URL של התמונה אם היא מוכנה, None אחרת
            
        Raises:
            Exception: If there's an unexpected status or error
        """
        try:
            status_response = self.check_image_status(request_id)
            
            if status_response.get('status') == 'completed':
                return status_response.get('imageUrl')
            elif status_response.get('status') == 'processing':
                return None  # עדיין בעיבוד
            else:
                raise Exception(f"Unexpected status: {status_response.get('status')}")
                
        except Exception as error:
            logger.error(f"❌ Error getting ready image: {error}")
            raise error

    def wait_for_image(self, request_id: str, max_attempts: int = 20, interval: float = 3.0) -> str:
        """
        פונקציה שממתינה לתמונה עד שהיא מוכנה או עד timeout
        
        Args:
            request_id (str): מזהה הבקשה
            max_attempts (int): מספר נסיונות מקסימלי (ברירת מחדל: 20)
            interval (float): מרווח זמן בין בדיקות בשניות (ברירת מחדל: 3.0)
            
        Returns:
            str: מחזיר את כתובת ה-URL של התמונה כשהיא מוכנה
            
        Raises:
            Exception: If image generation fails or max attempts reached
        """
        attempts = 0
        
        while attempts < max_attempts:
            try:
                attempts += 1
                logger.info(f"Checking image status (attempt {attempts}/{max_attempts})...")
                
                status_response = self.check_image_status(request_id)
                
                if status_response.get('status') == 'completed':
                    logger.info('✅ Image is ready!')
                    return status_response.get('imageUrl')
                elif status_response.get('status') == 'failed':
                    raise Exception('Image generation failed')
                elif attempts >= max_attempts:
                    raise Exception('Max attempts reached waiting for image')
                
                # עדיין בעיבוד, המשך לבדוק
                time.sleep(interval)
                
            except Exception as error:
                logger.error(f"❌ Error in wait_for_image: {error}")
                raise error
        
        raise Exception('Max attempts reached waiting for image')

    async def wait_for_image_async(self, request_id: str, max_attempts: int = 20, interval: float = 3.0) -> str:
        """
        גרסה אסינכרונית של wait_for_image
        
        Args:
            request_id (str): מזהה הבקשה
            max_attempts (int): מספר נסיונות מקסימלי (ברירת מחדל: 20)
            interval (float): מרווח זמן בין בדיקות בשניות (ברירת מחדל: 3.0)
            
        Returns:
            str: מחזיר את כתובת ה-URL של התמונה כשהיא מוכנה
            
        Raises:
            Exception: If image generation fails or max attempts reached
        """
        attempts = 0
        
        while attempts < max_attempts:
            try:
                attempts += 1
                logger.info(f"Checking image status (attempt {attempts}/{max_attempts})...")
                
                status_response = self.check_image_status(request_id)
                
                if status_response.get('status') == 'completed':
                    logger.info('✅ Image is ready!')
                    return status_response.get('imageUrl')
                elif status_response.get('status') == 'failed':
                    raise Exception('Image generation failed')
                elif attempts >= max_attempts:
                    raise Exception('Max attempts reached waiting for image')
                
                # עדיין בעיבוד, המשך לבדוק
                await asyncio.sleep(interval)
                
            except Exception as error:
                logger.error(f"❌ Error in wait_for_image_async: {error}")
                raise error
        
        raise Exception('Max attempts reached waiting for image')

    def test_connection(self) -> Dict[str, Any]:
        """
        בודק את החיבור לשרת TTAPI
        
        Returns:
            Dict: תשובה מהשרת על מצב החיבור
            
        Raises:
            requests.RequestException: If the connection test fails
        """
        try:
            url = f"{self.base_url}/test-ttapi"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"✅ TTAPI connection test successful: {result}")
            return result
            
        except requests.RequestException as error:
            logger.error(f"❌ TTAPI connection test failed: {error}")
            raise error

    def get_all_requests(self) -> list:
        """
        מחזיר את כל הבקשות (לדיבאג)
        
        Returns:
            list: רשימת כל הבקשות
            
        Raises:
            requests.RequestException: If the request fails
        """
        try:
            url = f"{self.base_url}/requests"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"✅ Retrieved all requests: {len(result)} requests")
            return result
            
        except requests.RequestException as error:
            logger.error(f"❌ Error getting all requests: {error}")
            raise error

    def close(self):
        """
        סוגר את ה-session
        """
        self.session.close()

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Create a singleton instance
ttapi_service = TTAPIService()

# Example usage functions
def create_image_from_answers(answers: Dict[str, Any], prompt: str) -> str:
    """
    פונקציה נוחה ליצירת תמונה והמתנה לתוצאה
    
    Args:
        answers (Dict): תשובות המשתמש
        prompt (str): פרומפט לתמונה
        
    Returns:
        str: URL של התמונה המוכנה
    """
    # יצירת בקשה
    response = ttapi_service.create_image_request(answers, prompt)
    request_id = response.get('requestId')
    
    if not request_id:
        raise Exception('No request ID received')
    
    # המתנה לתמונה
    image_url = ttapi_service.wait_for_image(request_id)
    return image_url

async def create_image_from_answers_async(answers: Dict[str, Any], prompt: str) -> str:
    """
    גרסה אסינכרונית של create_image_from_answers
    
    Args:
        answers (Dict): תשובות המשתמש
        prompt (str): פרומפט לתמונה
        
    Returns:
        str: URL של התמונה המוכנה
    """
    # יצירת בקשה
    response = ttapi_service.create_image_request(answers, prompt)
    request_id = response.get('requestId')
    
    if not request_id:
        raise Exception('No request ID received')
    
    # המתנה לתמונה (אסינכרונית)
    image_url = await ttapi_service.wait_for_image_async(request_id)
    return image_url 