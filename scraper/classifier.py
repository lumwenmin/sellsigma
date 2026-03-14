import os
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are a sales signal classifier. Given a Reddit post title and body,
determine if it shows buying intent or a pain point that a SaaS product could address.

Respond with JSON: {"is_intent": true/false, "score": 0.0-1.0, "matched_signals": ["signal1", ...]}"""

async def classify_post(title: str, body: str) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Title: {title}\n\nBody: {body}"},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )
    import json
    return json.loads(response.choices[0].message.content)
