from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class RunbookStep(BaseModel):
    id: str
    order: int
    title: str
    description: str
    estimatedMinutes: int
    commands: list[str] = []
    notes: str | None = None


class RunbookBase(BaseModel):
    title: str
    description: str
    tags: list[str] = []
    severity: Literal["P1", "P2", "P3", "P4"]
    steps: list[RunbookStep] = []


class RunbookCreate(RunbookBase):
    id: str | None = None


class RunbookUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None
    severity: Literal["P1", "P2", "P3", "P4"] | None = None
    steps: list[RunbookStep] | None = None


class RunbookResponse(RunbookBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
