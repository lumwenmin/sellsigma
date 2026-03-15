from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.dependencies import supabase, get_current_user
from app.models.config import ConfigUpdate

router = APIRouter(prefix="/config", tags=["config"])


@router.get("")
def get_config(user=Depends(get_current_user)):
    result = supabase.table("user_configs").select("*").eq("user_id", user.id).execute()
    if not result.data:
        return {"subreddits": [], "intent_signals": []}
    return result.data[0]


@router.put("")
def update_config(config: ConfigUpdate, user=Depends(get_current_user)):
    result = supabase.table("user_configs").upsert(
        {
            "user_id": user.id,
            "subreddits": config.subreddits,
            "intent_signals": config.intent_signals,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="user_id",
    ).execute()
    return result.data[0]
