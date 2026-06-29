from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import traceback

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.dependencies.database import get_db

setup_logging()

def create_app() -> FastAPI:
    from app.api.router import api_router
    
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.API_VERSION,
        description="FastAPI backend for Postman clone proxy and data persistence."
    )

    app.include_router(api_router, prefix="/api/v1")

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"}
        )

    @app.get("/health")
    async def health_check(db: AsyncSession = Depends(get_db)):
        status = {"status": "healthy", "database": "connected", "version": settings.API_VERSION}
        try:
            # Verify DB connection
            await db.execute(text("SELECT 1"))
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            status["status"] = "unhealthy"
            status["database"] = "disconnected"
        
        return status

    return app

app = create_app()
