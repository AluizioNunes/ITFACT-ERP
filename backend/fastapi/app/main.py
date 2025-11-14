from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.crm import router as crm_router
from .routers.catalogs import router as catalogs_router
import os

app = FastAPI(title="ERP CRM API")

origins_env = os.getenv("CORS_ORIGIN", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177")
origins = [o.strip() for o in origins_env.split(',') if o.strip()]
allow_all = any(o == "*" for o in origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crm_router, prefix="/api/crm", tags=["crm"])
app.include_router(catalogs_router, prefix="/api/catalogs", tags=["catalogs"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Migrações Alembic gerenciam o schema; sem create-on-startup