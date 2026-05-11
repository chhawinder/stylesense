from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.api import auth, profile, recommendations, products

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StyleSense API",
    description="AI-powered fashion recommendation platform for Indian users",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recommendations.router)
app.include_router(products.router)


@app.get("/")
async def root():
    return {"name": "StyleSense API", "version": "0.1.0", "status": "running"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
