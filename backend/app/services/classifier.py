import os
import json
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


async def classify_post(title: str, body: str, intent_signals: list[str]) -> dict:
    signals_text = "\n".join(f"- {s}" for s in intent_signals)
    system_prompt = f"""You are a sales signal classifier. Given a Reddit post title and body,
determine if it matches any of these intent signals:

{signals_text}

Respond with JSON: {{"is_intent": true/false, "score": 0.0-1.0, "matched_signals": ["signal1", ...]}}"""

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Title: {title}\n\nBody: {body}",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
        ),
    )
    if not response.text:
        raise ValueError("Empty response from Gemini")
    try:
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON from Gemini: {e}")
