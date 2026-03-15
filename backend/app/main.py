from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.models import runbook, incident  # noqa: F401 — register models
from app.api import analyze, runbooks, incidents

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IncidentPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(runbooks.router)
app.include_router(incidents.router)


@app.get("/health")
def health():
    return {"status": "ok"}
