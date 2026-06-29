from sqlalchemy import String, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional, Any
from app.models.base import Base, BaseModelMixin

class History(Base, BaseModelMixin):
    __tablename__ = "history"

    method: Mapped[str] = mapped_column(String(20), index=True)
    url: Mapped[str] = mapped_column(String(2048))
    status_code: Mapped[int] = mapped_column(Integer)
    response_time_ms: Mapped[int] = mapped_column(Integer)
    response_size: Mapped[int] = mapped_column(Integer)
    
    # Snapshot of execution
    request_headers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    response_headers: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    response_body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    environment_uuid: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
