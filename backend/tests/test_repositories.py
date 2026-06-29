import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories import collection_repo, folder_repo, request_repo, setting_repo
from app.schemas.collections import CollectionCreate, CollectionUpdate
from app.schemas.folders import FolderCreate
from app.schemas.requests import RequestCreate
from app.repositories.exceptions import DuplicateError

pytestmark = pytest.mark.asyncio

async def test_collection_crud(db_session: AsyncSession):
    # Create
    col_schema = CollectionCreate(name="Test API")
    col = await collection_repo.create(db_session, col_schema)
    await db_session.commit()
    assert col.id is not None
    assert col.uuid is not None
    assert col.name == "Test API"

    # Get
    fetched = await collection_repo.get_by_uuid(db_session, col.uuid)
    assert fetched is not None
    assert fetched.name == "Test API"

    # Update
    updated = await collection_repo.update(db_session, fetched, CollectionUpdate(name="Updated API"))
    await db_session.commit()
    assert updated.name == "Updated API"

    # Delete
    await collection_repo.delete(db_session, updated)
    await db_session.commit()
    assert await collection_repo.get_by_uuid(db_session, col.uuid) is None

async def test_cascade_delete(db_session: AsyncSession):
    col = await collection_repo.create(db_session, CollectionCreate(name="Parent Col"))
    await db_session.commit()

    folder = await folder_repo.create(db_session, {"name": "Child Folder", "collection_id": col.id})
    req = await request_repo.create(db_session, {"name": "Req", "method": "GET", "url": "http://x", "collection_id": col.id})
    await db_session.commit()

    # Verify they exist
    assert await folder_repo.get_by_uuid(db_session, folder.uuid) is not None

    # Delete collection
    await collection_repo.delete(db_session, col)
    await db_session.commit()

    # Verify cascade delete
    assert await folder_repo.get_by_uuid(db_session, folder.uuid) is None
    assert await request_repo.get_by_uuid(db_session, req.uuid) is None

async def test_eager_loading(db_session: AsyncSession):
    col = await collection_repo.create(db_session, CollectionCreate(name="Eager Col"))
    await db_session.commit()
    await folder_repo.create(db_session, {"name": "F1", "collection_id": col.id})
    await db_session.commit()

    # Test eager load
    col_nested = await collection_repo.get_by_uuid_with_nested(db_session, col.uuid)
    assert len(col_nested.folders) == 1
    assert col_nested.folders[0].name == "F1"

async def test_setting_key_value(db_session: AsyncSession):
    s1 = await setting_repo.set_value(db_session, "theme", "dark")
    await db_session.commit()
    
    s2 = await setting_repo.get_by_key(db_session, "theme")
    assert s2.value == "dark"
