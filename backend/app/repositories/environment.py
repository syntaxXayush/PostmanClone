from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.repositories.base import BaseRepository
from app.models.environments import Environment, EnvironmentVariable
from app.schemas.environments import EnvironmentCreate, EnvironmentUpdate, EnvironmentVariableCreate, EnvironmentVariableUpdate

class EnvironmentRepository(BaseRepository[Environment, EnvironmentCreate, EnvironmentUpdate]):
    def __init__(self):
        super().__init__(Environment)

    async def get_by_uuid_with_variables(self, session: AsyncSession, uuid: str) -> Optional[Environment]:
        stmt = select(Environment).where(Environment.uuid == uuid).options(
            selectinload(Environment.variables)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_all_with_variables(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[Environment]:
        stmt = select(Environment).options(
            selectinload(Environment.variables)
        ).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

class EnvironmentVariableRepository(BaseRepository[EnvironmentVariable, EnvironmentVariableCreate, EnvironmentVariableUpdate]):
    def __init__(self):
        super().__init__(EnvironmentVariable)

environment_repo = EnvironmentRepository()
environment_variable_repo = EnvironmentVariableRepository()
