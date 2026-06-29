from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import Any
from app.models.base import Base

class Setting(Base):
    """
    Key/Value configuration table.
    We drop BaseModelMixin because a generic key-value store 
    doesn't strictly need UUIDs or integer IDs, the 'key' is naturally the PK.
    """
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
