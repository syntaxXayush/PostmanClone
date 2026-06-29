from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.repositories.base import BaseRepository
from app.models.history import History
from app.schemas.history import HistoryCreate, HistoryRead

class HistoryRepository(BaseRepository[History, HistoryCreate, HistoryRead]):
    def __init__(self):
        super().__init__(History)

    async def get_recent(self, session: AsyncSession, limit: int = 50) -> List[History]:
        stmt = select(History).order_by(desc(History.created_at)).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def search(self, session: AsyncSession, url_term: str, skip: int = 0, limit: int = 100) -> List[History]:
        stmt = select(History).where(
            History.url.ilike(f"%{url_term}%")
        ).order_by(desc(History.created_at)).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

history_repo = HistoryRepository()
