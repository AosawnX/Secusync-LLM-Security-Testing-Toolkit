from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class RunStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class RunCreate(BaseModel):
    target_id: str
    attack_class: str = "prompt_injection"

class Run(BaseModel):
    id: str
    target_id: str
    target_name: Optional[str] = None
    status: RunStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    log_path: Optional[str] = None
    result_summary: Optional[str] = None
    vulnerability_score: Optional[float] = 0.0
    findings: Optional[List[dict]] = []
    visible_in_history: bool = True
