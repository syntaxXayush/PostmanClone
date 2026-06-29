from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.request import request_repo
from app.repositories.collection import collection_repo, folder_repo
from app.services.exceptions import RequestNotFoundError, CollectionNotFoundError, FolderNotFoundError, ServiceError
from app.schemas.requests import RequestCreate, RequestUpdate, RequestRead

logger = logging.getLogger(__name__)

class RequestService:
    async def create_request(self, session: AsyncSession, data: RequestCreate) -> RequestRead:
        try:
            request_data = data.model_dump(exclude={"collection_uuid", "folder_uuid"})
            
            if data.collection_uuid:
                col = await collection_repo.get_by_uuid(session, data.collection_uuid)
                if not col:
                    raise CollectionNotFoundError(f"Collection {data.collection_uuid} not found")
                request_data["collection_id"] = col.id
                
            if data.folder_uuid:
                folder = await folder_repo.get_by_uuid(session, data.folder_uuid)
                if not folder:
                    raise FolderNotFoundError(f"Folder {data.folder_uuid} not found")
                request_data["folder_id"] = folder.id

            request_obj = await request_repo.create(session, request_data)
            await session.commit()
            logger.info(f"Request created: {request_obj.uuid}")
            return RequestRead.model_validate(request_obj)
        except (CollectionNotFoundError, FolderNotFoundError):
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to create request: {e}") from e

    async def get_request(self, session: AsyncSession, uuid: str) -> RequestRead:
        req = await request_repo.get_by_uuid(session, uuid)
        if not req:
            raise RequestNotFoundError(f"Request {uuid} not found")
        return RequestRead.model_validate(req)

    async def update_request(self, session: AsyncSession, uuid: str, data: RequestUpdate) -> RequestRead:
        try:
            req = await request_repo.get_by_uuid(session, uuid)
            if not req:
                raise RequestNotFoundError(f"Request {uuid} not found")
            
            update_data = data.model_dump(exclude_unset=True, exclude={"folder_uuid"})
            if data.folder_uuid is not None:
                folder = await folder_repo.get_by_uuid(session, data.folder_uuid)
                if not folder:
                    raise FolderNotFoundError(f"Folder {data.folder_uuid} not found")
                update_data["folder_id"] = folder.id

            updated = await request_repo.update(session, req, update_data)
            await session.commit()
            logger.info(f"Request updated: {uuid}")
            return RequestRead.model_validate(updated)
        except (RequestNotFoundError, FolderNotFoundError):
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to update request: {e}") from e

    async def delete_request(self, session: AsyncSession, uuid: str) -> None:
        try:
            req = await request_repo.get_by_uuid(session, uuid)
            if not req:
                raise RequestNotFoundError(f"Request {uuid} not found")
            
            await request_repo.delete(session, req)
            await session.commit()
            logger.info(f"Request deleted: {uuid}")
        except RequestNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to delete request: {e}") from e

request_service = RequestService()
