from pydantic import BaseModel


class ConfigUpdate(BaseModel):
    subreddits: list[str]
    intent_signals: list[str]
