from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.history import history_repo
from app.services.exceptions import ServiceError
from app.schemas.history import HistoryRead

logger = logging.getLogger(__name__)

class HistoryService:
    async def get_recent_history(self, session: AsyncSession, limit: int = 50) -> List[HistoryRead]:
        history = await history_repo.get_recent(session, limit)
        return [HistoryRead.model_validate(h) for h in history]

    async def clear_history(self, session: AsyncSession) -> None:
        try:
            history = await history_repo.get_all(session, limit=10000)
            for h in history:
                await history_repo.delete(session, h)
            await session.commit()
            logger.info("History cleared")
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to clear history: {e}") from e

history_service = HistoryService()
