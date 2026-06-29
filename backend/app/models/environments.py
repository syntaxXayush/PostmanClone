from sqlalchemy import String, Boolean, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from app.models.base import Base, BaseModelMixin

class Environment(Base, BaseModelMixin):
    __tablename__ = "environments"
    __table_args__ = (CheckConstraint("length(name) > 0", name="chk_environments_name_not_empty"),)

    name: Mapped[str] = mapped_column(String(255), index=True)

    variables: Mapped[List["EnvironmentVariable"]] = relationship(
        "EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan", passive_deletes=True
    )

class EnvironmentVariable(Base, BaseModelMixin):
    __tablename__ = "environment_variables"
    __table_args__ = (
        UniqueConstraint('environment_id', 'key', name='uq_env_key'),
    )

    environment_id: Mapped[int] = mapped_column(ForeignKey("environments.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(String)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    environment: Mapped["Environment"] = relationship("Environment", back_populates="variables")
