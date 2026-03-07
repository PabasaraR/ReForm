# services/llm.py
import os
from google import genai
from dotenv import load_dotenv

class LLM:
    """LLM service"""
    
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        # Create Gemini client using API key from environment
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def call_llm(self, prompt):
         # Send prompt to Gemini model and generate feedback
        response = self.client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        return response.text