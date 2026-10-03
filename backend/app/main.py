"""
backend/app/main.py
-------------------
FastAPI Application Entry Point.
Real-Time Scientific Data Mining & Advanced RAG System Backend.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.endpoints import health
from backend.app.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("fastapi_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("================================================================================")
    logger.info("[STARTUP] Starting FastAPI Backend for Scientific Lakehouse & Data Mining")
    logger.info("[STARTUP] Server running on: http://%s:%d", settings.HOST, settings.PORT)
    logger.info("[STARTUP] Interactive OpenAPI Docs: http://localhost:%d/docs", settings.PORT)
    logger.info("[STARTUP] Parquet Path: %s (Exists: %s)", settings.SILVER_PARQUET, settings.SILVER_PARQUET.exists())
    logger.info("[STARTUP] LanceDB URI: %s", settings.LANCEDB_URI)
    logger.info("================================================================================")
    yield
    logger.info("[SHUTDOWN] Stopping FastAPI Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-Time Scientific Data Mining & Advanced RAG System API (FastAPI)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for Frontend Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Health endpoint at root
app.include_router(health.router)

# Include all API routes under /api
app.include_router(api_router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
