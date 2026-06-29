from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.settings import Setting
from app.schemas.settings import SettingCreate, SettingUpdate

class SettingRepository(BaseRepository[Setting, SettingCreate, SettingUpdate]):
    def __init__(self):
        super().__init__(Setting)

    async def get_by_key(self, session: AsyncSession, key: str) -> Optional[Setting]:
        stmt = select(Setting).where(Setting.key == key)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def set_value(self, session: AsyncSession, key: str, value: Any) -> Setting:
        setting = await self.get_by_key(session, key)
        if setting:
            setting.value = value
            session.add(setting)
        else:
            setting = Setting(key=key, value=value)
            session.add(setting)
        await session.flush()
        return setting

setting_repo = SettingRepository()
