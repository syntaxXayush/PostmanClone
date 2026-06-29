from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.collection import collection_repo, folder_repo
from app.services.exceptions import FolderNotFoundError, CollectionNotFoundError, ServiceError
from app.schemas.folders import FolderCreate, FolderUpdate, FolderRead

logger = logging.getLogger(__name__)

class FolderService:
    async def create_folder(self, session: AsyncSession, data: FolderCreate) -> FolderRead:
        try:
            # Resolve Collection UUID to ID
            collection = await collection_repo.get_by_uuid(session, data.collection_uuid)
            if not collection:
                raise CollectionNotFoundError(f"Collection {data.collection_uuid} not found")

            # Prepare data
            folder_data = data.model_dump(exclude={"collection_uuid"})
            folder_data["collection_id"] = collection.id

            folder = await folder_repo.create(session, folder_data)
            await session.commit()
            logger.info(f"Folder created: {folder.uuid}")
            return FolderRead.model_validate(folder)
        except CollectionNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to create folder: {e}") from e

    async def update_folder(self, session: AsyncSession, uuid: str, data: FolderUpdate) -> FolderRead:
        try:
            folder = await folder_repo.get_by_uuid(session, uuid)
            if not folder:
                raise FolderNotFoundError(f"Folder {uuid} not found")
            
            updated = await folder_repo.update(session, folder, data)
            await session.commit()
            logger.info(f"Folder updated: {uuid}")
            return FolderRead.model_validate(updated)
        except FolderNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to update folder: {e}") from e

    async def delete_folder(self, session: AsyncSession, uuid: str) -> None:
        try:
            folder = await folder_repo.get_by_uuid(session, uuid)
            if not folder:
                raise FolderNotFoundError(f"Folder {uuid} not found")
            
            await folder_repo.delete(session, folder)
            await session.commit()
            logger.info(f"Folder deleted: {uuid}")
        except FolderNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to delete folder: {e}") from e

folder_service = FolderService()
