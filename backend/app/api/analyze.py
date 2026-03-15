from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.extractor import extract_errors
from app.services.matcher import SUMMARIES, find_similar_incidents, match_runbooks

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    matches = match_runbooks(req.text, db)
    extracted_errors = extract_errors(req.text)
    similar_ids = find_similar_incidents(req.text, db)

    top_id = matches[0].runbookId if matches else ""
    summary = SUMMARIES.get(top_id, "장애 패턴 분석 완료 (Mock 모드)")

    return AnalyzeResponse(
        matches=matches,
        extractedErrors=extracted_errors,
        summary=summary,
        similarIncidentIds=similar_ids,
    )
