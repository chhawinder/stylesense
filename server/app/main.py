from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.api import auth, profile, recommendations, products, ensembles
from app.config import settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StyleSense API",
    description="AI-powered fashion recommendation platform for Indian users",
    version="0.1.0",
)

# Build allowed origins from settings + defaults
_origins = [
    "http://localhost:5174",
    "http://localhost:3000",
]
if settings.frontend_url and settings.frontend_url not in _origins:
    _origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recommendations.router)
app.include_router(products.router)
app.include_router(ensembles.router)


@app.get("/")
async def root():
    return {"name": "StyleSense API", "version": "0.1.0", "status": "running"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
