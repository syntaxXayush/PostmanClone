from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.collection import collection_repo
from app.repositories.exceptions import NotFoundError, DuplicateError
from app.services.exceptions import CollectionNotFoundError, ServiceError
from app.schemas.collections import CollectionCreate, CollectionUpdate, CollectionRead, CollectionNestedRead

logger = logging.getLogger(__name__)

class CollectionService:
    async def create_collection(self, session: AsyncSession, data: CollectionCreate) -> CollectionRead:
        try:
            collection = await collection_repo.create(session, data)
            await session.commit()
            logger.info(f"Collection created: {collection.uuid}")
            return CollectionRead.model_validate(collection)
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to create collection: {e}") from e

    async def get_all_collections(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[CollectionNestedRead]:
        collections = await collection_repo.get_all_with_nested(session, skip, limit)
        return [CollectionNestedRead.model_validate(c) for c in collections]

    async def get_collection(self, session: AsyncSession, uuid: str) -> CollectionNestedRead:
        collection = await collection_repo.get_by_uuid_with_nested(session, uuid)
        if not collection:
            raise CollectionNotFoundError(f"Collection {uuid} not found")
        return CollectionNestedRead.model_validate(collection)

    async def update_collection(self, session: AsyncSession, uuid: str, data: CollectionUpdate) -> CollectionRead:
        try:
            collection = await collection_repo.get_by_uuid(session, uuid)
            if not collection:
                raise CollectionNotFoundError(f"Collection {uuid} not found")
            
            updated = await collection_repo.update(session, collection, data)
            await session.commit()
            logger.info(f"Collection updated: {uuid}")
            return CollectionRead.model_validate(updated)
        except CollectionNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to update collection: {e}") from e

    async def delete_collection(self, session: AsyncSession, uuid: str) -> None:
        try:
            collection = await collection_repo.get_by_uuid(session, uuid)
            if not collection:
                raise CollectionNotFoundError(f"Collection {uuid} not found")
            
            await collection_repo.delete(session, collection)
            await session.commit()
            logger.info(f"Collection deleted: {uuid}")
        except CollectionNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to delete collection: {e}") from e

collection_service = CollectionService()
