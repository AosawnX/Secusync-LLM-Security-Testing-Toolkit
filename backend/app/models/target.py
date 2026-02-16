from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uuid
from datetime import datetime

class TargetType(str, Enum):
    CHAT_API = "chat_api"
    LOCAL_HARNESS = "local_harness"

class TargetProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Name of the target profile")
    target_type: TargetType
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: str = "gpt-3.5-turbo"
    created_at: datetime = Field(default_factory=datetime.now)
    
    # Feature flags
    enable_rag: bool = False
    enable_file_ingestion: bool = False
    enable_tool_calling: bool = False
    
    # Constraints
    rate_limit: int = 10
    
    # Gate
    authorized: bool = False

class TargetProfileCreate(BaseModel):
    name: str
    target_type: TargetType
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: str = "gpt-3.5-turbo"
    enable_rag: bool = False
    enable_file_ingestion: bool = False
    enable_tool_calling: bool = False
    rate_limit: int = 10
    authorized: bool = False
