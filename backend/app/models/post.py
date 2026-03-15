from pydantic import BaseModel
from typing import Optional


class PostUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_dismissed: Optional[bool] = None
