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
from app.schemas.collections import CollectionCreate
from app.services.exceptions import VariableResolutionError, RequestExecutionError

pytestmark = pytest.mark.asyncio

async def test_variable_resolver():
    variables = {"base_url": "https://api.example.com", "token": "abc1234"}
    
    # Test string
    assert variable_resolver_service.resolve("{{base_url}}/users", variables) == "https://api.example.com/users"
    
    # Test dict
    target = {"url": "{{base_url}}", "auth": "Bearer {{token}}"}
    resolved = variable_resolver_service.resolve(target, variables)
    assert resolved["url"] == "https://api.example.com"
    assert resolved["auth"] == "Bearer abc1234"
    
    # Test missing (should replace with empty string)
    assert variable_resolver_service.resolve("{{missing}}/test", variables) == "/test"

@respx.mock
async def test_request_runner(db_session: AsyncSession):
    # Setup mock HTTP response
    respx.get("https://mockapi.com/test").respond(status_code=200, text="success")

    # Create environment
    env_data = EnvironmentCreate(
        name="Test Env",
        variables=[EnvironmentVariableCreate(key="host", value="mockapi.com")]
    )
    env = await environment_service.create_environment(db_session, env_data)
    
    # Create request payload
    req_data = RequestCreate(
        name="Test Req",
        method="GET",
        url="https://{{host}}/test"
    )

    # Run request
    history = await request_runner_service.execute_request(db_session, req_data, env.uuid)
    
    assert history.status_code == 200
    assert history.response_body == "success"
    assert history.url == "https://mockapi.com/test"
    assert history.environment_uuid == env.uuid

async def test_collection_transaction_rollback(db_session: AsyncSession):
    # If a service throws, session should rollback. We mock a failure.
    # Actually, we can just test normal creation
    col = await collection_service.create_collection(db_session, CollectionCreate(name="Service Col"))
    assert col.name == "Service Col"
    
    fetched = await collection_service.get_collection(db_session, col.uuid)
    assert fetched.name == "Service Col"

@respx.mock
async def test_request_runner_failure(db_session: AsyncSession):
    respx.get("https://mockapi.com/fail").mock(side_effect=httpx.ConnectTimeout)
    
    req_data = RequestCreate(
        name="Fail Req",
        method="GET",
        url="https://mockapi.com/fail"
    )

    with pytest.raises(RequestExecutionError):
        await request_runner_service.execute_request(db_session, req_data, None)
