from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.repositories.setting import setting_repo
from app.services.exceptions import ServiceError
from app.schemas.settings import SettingRead

logger = logging.getLogger(__name__)

class SettingsService:
    async def get_setting(self, session: AsyncSession, key: str, default: Any = None) -> Any:
        setting = await setting_repo.get_by_key(session, key)
        return setting.value if setting else default

    async def set_setting(self, session: AsyncSession, key: str, value: Any) -> SettingRead:
        try:
            setting = await setting_repo.set_value(session, key, value)
            await session.commit()
            logger.info(f"Setting updated: {key}")
            return SettingRead.model_validate(setting)
        except Exception as e:
            await session.rollback()
            raise ServiceError(f"Failed to update setting {key}: {e}") from e

settings_service = SettingsService()
