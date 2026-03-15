from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.dependencies import supabase, get_current_user
from app.models.post import PostUpdate

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("")
def get_posts(
    is_read: Optional[bool] = None,
    is_dismissed: Optional[bool] = None,
    user=Depends(get_current_user),
):
    query = supabase.table("flagged_posts").select("*").eq("user_id", user.id).order("flagged_at", desc=True)
    if is_read is not None:
        query = query.eq("is_read", is_read)
    if is_dismissed is not None:
        query = query.eq("is_dismissed", is_dismissed)
    return query.execute().data


@router.patch("/{post_id}")
def update_post(post_id: str, update: PostUpdate, user=Depends(get_current_user)):
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("flagged_posts").update(data).eq("id", post_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    return result.data[0]
