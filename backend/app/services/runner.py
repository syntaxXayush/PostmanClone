import time
import httpx
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas.requests import RequestRead, RequestBase
from app.schemas.history import HistoryCreate, HistoryRead
from app.services.exceptions import RequestExecutionError, EnvironmentNotFoundError
from app.services.variable_resolver import variable_resolver_service
from app.repositories.environment import environment_repo
from app.repositories.history import history_repo

logger = logging.getLogger(__name__)

# Shared httpx AsyncClient
http_client = httpx.AsyncClient(verify=False)

class RequestRunnerService:
    async def execute_request(
        self, 
        session: AsyncSession, 
        request_data: RequestBase, 
        environment_uuid: Optional[str] = None
    ) -> HistoryRead:
        """
        Executes an HTTP request after resolving variables and logs to history.
        """
        logger.info(f"Starting execution for request to {request_data.url}")
        
        # 1. Fetch Environment Variables
        variables = await self._fetch_environment_variables(session, environment_uuid)
        
        # 2. Resolve Variables
        resolved_url = variable_resolver_service.resolve(request_data.url, variables)
        resolved_headers = variable_resolver_service.resolve(request_data.headers, variables)
        resolved_params = variable_resolver_service.resolve(request_data.params, variables)
        resolved_auth = variable_resolver_service.resolve(request_data.auth, variables)
        resolved_body = variable_resolver_service.resolve(request_data.raw_body, variables) if request_data.raw_body else None

        # 3. Build HTTP Request kwargs
        kwargs = self._build_http_kwargs(
            resolved_url, resolved_headers, resolved_params, 
            resolved_auth, request_data.body_type, resolved_body,
            request_data.timeout, request_data.follow_redirects
        )

        # 4. Execute HTTP Request
        response, elapsed_ms = await self._execute_http_request(request_data.method, resolved_url, kwargs)

        # 5. Persist History
        history_entry = await self._persist_history(
            session=session,
            method=request_data.method,
            url=resolved_url,
            response=response,
            elapsed_ms=elapsed_ms,
            environment_uuid=environment_uuid,
            request_headers=kwargs.get("headers", {})
        )

        # 6. Commit transaction
        await session.commit()
        
        logger.info(f"Execution completed with status {history_entry.status_code}")
        return HistoryRead.model_validate(history_entry)

    async def _fetch_environment_variables(self, session: AsyncSession, environment_uuid: Optional[str]) -> Dict[str, str]:
        if not environment_uuid:
            return {}
        
        env = await environment_repo.get_by_uuid_with_variables(session, environment_uuid)
        if not env:
            logger.error(f"Environment {environment_uuid} not found")
            raise EnvironmentNotFoundError(f"Environment with UUID {environment_uuid} not found")
        
        return {var.key: var.value for var in env.variables if var.enabled}

    def _build_http_kwargs(self, url: str, headers_list: list, params_list: list, auth: dict, body_type: str, raw_body: Optional[str], timeout_ms: int, follow_redirects: bool) -> dict:
        headers = {h["key"]: h["value"] for h in headers_list if h.get("enabled", True) and h.get("key")}
        params = {p["key"]: p["value"] for p in params_list if p.get("enabled", True) and p.get("key")}
        
        # Format Auth
        if auth and auth.get("type") == "bearer" and auth.get("token"):
            headers["Authorization"] = f"Bearer {auth['token']}"
        elif auth and auth.get("type") == "basic" and auth.get("username"):
            import base64
            auth_str = f"{auth.get('username')}:{auth.get('password', '')}"
            encoded = base64.b64encode(auth_str.encode()).decode()
            headers["Authorization"] = f"Basic {encoded}"

        kwargs = {
            "headers": headers,
            "params": params,
            "timeout": timeout_ms / 1000.0,
            "follow_redirects": follow_redirects,
        }

        if body_type != "none" and raw_body:
            kwargs["content"] = raw_body

        return kwargs

    async def _execute_http_request(self, method: str, url: str, kwargs: dict):
        start_time = time.perf_counter()
        try:
            response = await http_client.request(method, url, **kwargs)
            # Read content to ensure it's loaded
            await response.aread()
        except httpx.RequestError as e:
            logger.error(f"HTTPX RequestError: {e}")
            raise RequestExecutionError(f"HTTP Request failed: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error during HTTP execution: {e}")
            raise RequestExecutionError(f"Unexpected execution error: {str(e)}") from e
        
        end_time = time.perf_counter()
        elapsed_ms = int((end_time - start_time) * 1000)
        return response, elapsed_ms

    async def _persist_history(self, session: AsyncSession, method: str, url: str, response: httpx.Response, elapsed_ms: int, environment_uuid: Optional[str], request_headers: dict):
        
        # Try to parse response as text
        try:
            resp_body = response.text
        except Exception:
            resp_body = "<binary or undisplayable data>"

        history_schema = HistoryCreate(
            method=method,
            url=url,
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            response_size=len(response.content) if response.content else 0,
            request_headers=request_headers,
            response_headers=dict(response.headers),
            response_body=resp_body,
            environment_uuid=environment_uuid
        )
        
        history_entry = await history_repo.create(session, history_schema)
        return history_entry

request_runner_service = RequestRunnerService()
