import os
import json
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a sales signal classifier. Given a Reddit post title and body,
determine if it shows buying intent or a pain point that a SaaS product could address.

Respond with JSON: {"is_intent": true/false, "score": 0.0-1.0, "matched_signals": ["signal1", ...]}"""


async def classify_post(title: str, body: str) -> dict:
    response = await client.aio.models.generate_content(
        model="gemini-2-flash-preview",
        contents=f"Title: {title}\n\nBody: {body}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
        ),
    )
    if not response.text:
        raise ValueError("Empty response from Gemini")
    return json.loads(response.text)
