from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.collections import Collection, Folder
from app.schemas.collections import CollectionCreate, CollectionUpdate
from app.schemas.folders import FolderCreate, FolderUpdate

class CollectionRepository(BaseRepository[Collection, CollectionCreate, CollectionUpdate]):
    def __init__(self):
        super().__init__(Collection)

    async def get_by_uuid_with_nested(self, session: AsyncSession, uuid: str) -> Optional[Collection]:
        stmt = select(Collection).where(Collection.uuid == uuid).options(
            selectinload(Collection.folders),
            selectinload(Collection.requests)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all_with_nested(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Collection]:
        stmt = select(Collection).options(
            selectinload(Collection.folders),
            selectinload(Collection.requests)
        ).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def search(self, session: AsyncSession, term: str, skip: int = 0, limit: int = 100) -> List[Collection]:
        stmt = select(Collection).where(Collection.name.ilike(f"%{term}%")).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

class FolderRepository(BaseRepository[Folder, FolderCreate, FolderUpdate]):
    def __init__(self):
        super().__init__(Folder)

collection_repo = CollectionRepository()
folder_repo = FolderRepository()
