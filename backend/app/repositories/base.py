from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exc
from pydantic import BaseModel
from app.repositories.exceptions import NotFoundError, DuplicateError
import logging

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

logger = logging.getLogger(__name__)

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get_by_uuid(self, session: AsyncSession, uuid: str) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.uuid == uuid)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, session: AsyncSession, obj_in: CreateSchemaType | dict[str, Any]) -> ModelType:
        obj_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        db_obj = self.model(**obj_data)
        session.add(db_obj)
        try:
            await session.flush()
        except exc.IntegrityError as e:
            logger.error(f"Database IntegrityError in {self.model.__name__}: {e}")
            raise DuplicateError(f"Integrity error creating {self.model.__name__}") from e
        return db_obj

    async def update(self, session: AsyncSession, db_obj: ModelType, obj_in: UpdateSchemaType | dict[str, Any]) -> ModelType:
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        session.add(db_obj)
        try:
            await session.flush()
        except exc.IntegrityError as e:
            logger.error(f"Database IntegrityError updating {self.model.__name__}: {e}")
            raise DuplicateError(f"Integrity error updating {self.model.__name__}") from e
        return db_obj

    async def delete(self, session: AsyncSession, db_obj: ModelType) -> None:
        await session.delete(db_obj)
        await session.flush()

    async def exists(self, session: AsyncSession, uuid: str) -> bool:
        stmt = select(self.model.uuid).where(self.model.uuid == uuid)
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None
