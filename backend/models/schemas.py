from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class LogEntry(BaseModel):
    module: str = Field(..., description="Module name or identifier")
    uri: str = Field(..., description="Request URI")
    created_at: datetime = Field(default_factory=datetime.now, description="Timestamp of the log entry")
    status: int = Field(..., description="HTTP status code")
    request_headers: Dict[str, str] = Field(default_factory=dict, description="Request headers")
    input: Any = Field(..., description="Request input data")
    risk_range: str = Field(..., description="Risk assessment range")
    verb: str = Field(..., description="HTTP method/verb")

    class Config:
        json_schema_extra = {
            "example": {
                "module": "authentication",
                "uri": "/api/v1/login",
                "created_at": "2024-03-20T10:30:00",
                "status": 200,
                "request_headers": {"Content-Type": "application/json"},
                "input": {"username": "user123"},
                "risk_range": "low",
                "verb": "POST"
            }
        }