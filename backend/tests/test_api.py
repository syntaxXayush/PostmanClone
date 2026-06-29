import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

async def test_health(async_client: AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

async def test_collections_api(async_client: AsyncClient):
    # Create Collection
    res = await async_client.post("/api/v1/collections/", json={"name": "API Test"})
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["name"] == "API Test"
    uuid = data["uuid"]

    # Get All
    res = await async_client.get("/api/v1/collections/")
    assert res.status_code == 200
    assert len(res.json()["data"]) > 0

    # Get One
    res = await async_client.get(f"/api/v1/collections/{uuid}")
    assert res.status_code == 200
    assert res.json()["data"]["name"] == "API Test"

    # Update
    res = await async_client.patch(f"/api/v1/collections/{uuid}", json={"name": "API Test Updated"})
    assert res.status_code == 200
    assert res.json()["data"]["name"] == "API Test Updated"

    # Delete
    res = await async_client.delete(f"/api/v1/collections/{uuid}")
    assert res.status_code == 200

    # Get One Not Found
    res = await async_client.get(f"/api/v1/collections/{uuid}")
    assert res.status_code == 404

async def test_settings_api(async_client: AsyncClient):
    res = await async_client.put("/api/v1/settings/theme", json={"value": "light"})
    assert res.status_code == 200
    
    res = await async_client.get("/api/v1/settings/theme")
    assert res.status_code == 200
    assert res.json()["data"] == "light"
