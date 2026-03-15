from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class IncidentBase(BaseModel):
    date: datetime
    service: str
    symptom: str
    cause: str
    resolution: str
    duration_minutes: int
    severity: Literal["P1", "P2", "P3", "P4"]
    related_runbook_id: str


class IncidentCreate(IncidentBase):
    id: str | None = None


class IncidentResponse(IncidentBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
