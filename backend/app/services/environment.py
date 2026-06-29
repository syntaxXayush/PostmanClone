from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.environment import environment_repo, environment_variable_repo
from app.services.exceptions import EnvironmentNotFoundError, ServiceError
from app.schemas.environments import EnvironmentCreate, EnvironmentUpdate, EnvironmentRead, EnvironmentVariableCreate

logger = logging.getLogger(__name__)

class EnvironmentService:
    async def create_environment(self, session: AsyncSession, data: EnvironmentCreate) -> EnvironmentRead:
        try:
            env_data = {"name": data.name}
            env = await environment_repo.create(session, env_data)
            
            for var_data in data.variables:
                var_dict = var_data.model_dump()
                var_dict["environment_id"] = env.id
                await environment_variable_repo.create(session, var_dict)
                
            await session.commit()
            logger.info(f"Environment created: {env.uuid}")
            # Refresh to load variables
            env_loaded = await environment_repo.get_by_uuid_with_variables(session, env.uuid)
            return EnvironmentRead.model_validate(env_loaded)
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to create environment: {e}") from e

    async def get_all_environments(self, session: AsyncSession, skip: int = 0, limit: int = 100) -> List[EnvironmentRead]:
        envs = await environment_repo.get_all_with_variables(session, skip, limit)
        return [EnvironmentRead.model_validate(e) for e in envs]

    async def get_environment(self, session: AsyncSession, uuid: str) -> EnvironmentRead:
        env = await environment_repo.get_by_uuid_with_variables(session, uuid)
        if not env:
            raise EnvironmentNotFoundError(f"Environment {uuid} not found")
        return EnvironmentRead.model_validate(env)

    async def update_environment(self, session: AsyncSession, uuid: str, data: EnvironmentUpdate) -> EnvironmentRead:
        try:
            env = await environment_repo.get_by_uuid(session, uuid)
            if not env:
                raise EnvironmentNotFoundError(f"Environment {uuid} not found")
            
            updated = await environment_repo.update(session, env, data)
            await session.commit()
            logger.info(f"Environment updated: {uuid}")
            env_loaded = await environment_repo.get_by_uuid_with_variables(session, updated.uuid)
            return EnvironmentRead.model_validate(env_loaded)
        except EnvironmentNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to update environment: {e}") from e

    async def delete_environment(self, session: AsyncSession, uuid: str) -> None:
        try:
            env = await environment_repo.get_by_uuid(session, uuid)
            if not env:
                raise EnvironmentNotFoundError(f"Environment {uuid} not found")
            
            await environment_repo.delete(session, env)
            await session.commit()
            logger.info(f"Environment deleted: {uuid}")
        except EnvironmentNotFoundError:
            raise
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to delete environment: {e}") from e

environment_service = EnvironmentService()
