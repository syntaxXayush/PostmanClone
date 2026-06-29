from fastapi import Depends
from app.services.collection import collection_service, CollectionService
from app.services.folder import folder_service, FolderService
from app.services.request import request_service, RequestService
from app.services.environment import environment_service, EnvironmentService
from app.services.history import history_service, HistoryService
from app.services.settings import settings_service, SettingsService
from app.services.runner import request_runner_service, RequestRunnerService
from app.services.variable_resolver import variable_resolver_service, VariableResolverService

# These dependencies will be used by the FastAPI routers to inject the services
# ensuring that the API layer does not instantiate services manually.

def get_collection_service() -> CollectionService:
    return collection_service

def get_folder_service() -> FolderService:
    return folder_service

def get_request_service() -> RequestService:
    return request_service

def get_environment_service() -> EnvironmentService:
    return environment_service

def get_history_service() -> HistoryService:
    return history_service

def get_settings_service() -> SettingsService:
    return settings_service

def get_request_runner_service() -> RequestRunnerService:
    return request_runner_service

def get_variable_resolver_service() -> VariableResolverService:
    return variable_resolver_service
