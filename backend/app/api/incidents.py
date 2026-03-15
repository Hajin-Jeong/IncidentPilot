import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentResponse

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.date.desc()).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.post("", response_model=IncidentResponse, status_code=201)
def create_incident(body: IncidentCreate, db: Session = Depends(get_db)):
    inc = Incident(
        id=body.id or f"inc-{uuid.uuid4().hex[:8]}",
        date=body.date,
        service=body.service,
        symptom=body.symptom,
        cause=body.cause,
        resolution=body.resolution,
        duration_minutes=body.duration_minutes,
        severity=body.severity,
        related_runbook_id=body.related_runbook_id,
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc
