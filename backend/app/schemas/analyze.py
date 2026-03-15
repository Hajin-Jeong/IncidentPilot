from pydantic import BaseModel


class MatchResult(BaseModel):
    runbookId: str
    confidence: int
    reasoning: str


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    matches: list[MatchResult]
    extractedErrors: list[str]
    summary: str
    similarIncidentIds: list[str]
