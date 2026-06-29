from fastapi import APIRouter
from app.api.endpoints import collections, folders, requests, environments, history, settings, runner

api_router = APIRouter()

api_router.include_router(collections.router)
api_router.include_router(folders.router)
api_router.include_router(requests.router)
api_router.include_router(environments.router)
api_router.include_router(history.router)
api_router.include_router(settings.router)
api_router.include_router(runner.router)
