from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.requests import Request
from app.schemas.requests import RequestCreate, RequestUpdate

class RequestRepository(BaseRepository[Request, RequestCreate, RequestUpdate]):
    def __init__(self):
        super().__init__(Request)

    async def search(self, session: AsyncSession, term: str, skip: int = 0, limit: int = 100) -> List[Request]:
        stmt = select(Request).where(
            (Request.name.ilike(f"%{term}%")) | (Request.url.ilike(f"%{term}%"))
        ).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

request_repo = RequestRepository()
