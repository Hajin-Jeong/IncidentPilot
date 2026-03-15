"""
Seed the database with runbooks and incidents from frontend JSON files.
Usage: python -m scripts.seed
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone

# Allow running from backend/ directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, Base, engine  # noqa: E402
from app.models.runbook import Runbook  # noqa: E402
from app.models.incident import Incident  # noqa: E402

FRONTEND_DATA = Path(__file__).parent.parent.parent / "frontend" / "src" / "data"


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Runbooks ──────────────────────────────────────────────
        rb_path = FRONTEND_DATA / "runbooks.json"
        runbooks = json.loads(rb_path.read_text(encoding="utf-8"))
        existing_ids = {r.id for r in db.query(Runbook.id).all()}

        added_rb = 0
        for rb in runbooks:
            if rb["id"] not in existing_ids:
                db.add(Runbook(
                    id=rb["id"],
                    title=rb["title"],
                    description=rb["description"],
                    tags=rb.get("tags", []),
                    severity=rb["severity"],
                    steps=rb.get("steps", []),
                ))
                added_rb += 1

        # ── Incidents ─────────────────────────────────────────────
        inc_path = FRONTEND_DATA / "incidents.json"
        incidents = json.loads(inc_path.read_text(encoding="utf-8"))
        existing_inc_ids = {i.id for i in db.query(Incident.id).all()}

        added_inc = 0
        for inc in incidents:
            if inc["id"] not in existing_inc_ids:
                db.add(Incident(
                    id=inc["id"],
                    date=datetime.fromisoformat(inc["date"].replace("Z", "+00:00")),
                    service=inc["service"],
                    symptom=inc["symptom"],
                    cause=inc["cause"],
                    resolution=inc["resolution"],
                    duration_minutes=inc["durationMinutes"],
                    severity=inc["severity"],
                    related_runbook_id=inc["relatedRunbookId"],
                ))
                added_inc += 1

        db.commit()
        print(f"✅ Seeded {added_rb} runbooks, {added_inc} incidents")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
