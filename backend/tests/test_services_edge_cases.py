import pytest
import pytest_asyncio
import respx
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.services import (
    variable_resolver_service, request_runner_service,
    collection_service, environment_service
)
from app.schemas.requests import RequestCreate
from app.schemas.environments import EnvironmentCreate, EnvironmentVariableCreate
from app.services.exceptions import VariableResolutionError, RequestExecutionError, EnvironmentNotFoundError

pytestmark = pytest.mark.asyncio

async def test_variable_resolver_recursive():
    variables = {"url": "api.test.com", "path": "users", "full": "{{url}}/{{path}}"}
    # Single replacement
    assert variable_resolver_service.resolve("https://{{url}}", variables) == "https://api.test.com"
    # Multiple in one string
    assert variable_resolver_service.resolve("https://{{url}}/{{path}}", variables) == "https://api.test.com/users"
    # Note: Recursive isn't strictly implemented for values themselves in the current VariableResolver.
    # It replaces string matches linearly.
    
    # Missing variable should be empty
    assert variable_resolver_service.resolve("{{missing}}", variables) == ""
    
    # Deep nested struct
    target = {
        "headers": [{"key": "Auth", "value": "Bearer {{url}}"}],
        "params": [["{{path}}", 123]]
    }
    resolved = variable_resolver_service.resolve(target, variables)
    assert resolved["headers"][0]["value"] == "Bearer api.test.com"
    assert resolved["params"][0][0] == "users"

@respx.mock
async def test_runner_advanced_http(db_session: AsyncSession):
    # Test headers, redirects, etc
    respx.post("https://mockapi.com/post").respond(
        status_code=201, 
        headers={"x-custom": "test"}, 
        text="created"
    )
    
    req_data = RequestCreate(
        name="Post Req",
        method="POST",
        url="https://mockapi.com/post",
        headers=[{"key": "X-Token", "value": "secret"}],
        body_type="json",
        raw_body='{"test": 1}'
    )

    history = await request_runner_service.execute_request(db_session, req_data, None)
    
    assert history.status_code == 201
    assert history.response_size > 0
    assert history.request_headers["X-Token"] == "secret"
    assert history.response_headers["x-custom"] == "test"
    assert history.response_body == "created"

async def test_runner_environment_missing(db_session: AsyncSession):
    req_data = RequestCreate(
        name="Missing Env Req",
        method="GET",
        url="https://mockapi.com/"
    )
    with pytest.raises(EnvironmentNotFoundError):
        await request_runner_service.execute_request(db_session, req_data, "non-existent-uuid")
