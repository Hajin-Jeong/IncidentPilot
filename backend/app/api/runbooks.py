import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.runbook import Runbook
from app.schemas.runbook import RunbookCreate, RunbookResponse, RunbookUpdate

router = APIRouter(prefix="/api/runbooks", tags=["runbooks"])


@router.get("", response_model=list[RunbookResponse])
def list_runbooks(db: Session = Depends(get_db)):
    return db.query(Runbook).order_by(Runbook.created_at).all()


@router.get("/{runbook_id}", response_model=RunbookResponse)
def get_runbook(runbook_id: str, db: Session = Depends(get_db)):
    rb = db.query(Runbook).filter(Runbook.id == runbook_id).first()
    if not rb:
        raise HTTPException(status_code=404, detail="Runbook not found")
    return rb


@router.post("", response_model=RunbookResponse, status_code=201)
def create_runbook(body: RunbookCreate, db: Session = Depends(get_db)):
    rb = Runbook(
        id=body.id or f"rb-{uuid.uuid4().hex[:8]}",
        title=body.title,
        description=body.description,
        tags=body.tags,
        severity=body.severity,
        steps=[s.model_dump() for s in body.steps],
    )
    db.add(rb)
    db.commit()
    db.refresh(rb)
    return rb


@router.put("/{runbook_id}", response_model=RunbookResponse)
def update_runbook(runbook_id: str, body: RunbookUpdate, db: Session = Depends(get_db)):
    rb = db.query(Runbook).filter(Runbook.id == runbook_id).first()
    if not rb:
        raise HTTPException(status_code=404, detail="Runbook not found")
    for field, value in body.model_dump(exclude_none=True).items():
        if field == "steps" and value is not None:
            value = [s.model_dump() if hasattr(s, "model_dump") else s for s in value]
        setattr(rb, field, value)
    db.commit()
    db.refresh(rb)
    return rb


@router.delete("/{runbook_id}", status_code=204)
def delete_runbook(runbook_id: str, db: Session = Depends(get_db)):
    rb = db.query(Runbook).filter(Runbook.id == runbook_id).first()
    if not rb:
        raise HTTPException(status_code=404, detail="Runbook not found")
    db.delete(rb)
    db.commit()
