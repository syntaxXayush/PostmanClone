from sqlalchemy import String, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from app.models.base import Base, BaseModelMixin

if TYPE_CHECKING:
    from app.models.requests import Request

class Collection(Base, BaseModelMixin):
    __tablename__ = "collections"
    __table_args__ = (CheckConstraint("length(name) > 0", name="chk_collections_name_not_empty"),)

    name: Mapped[str] = mapped_column(String(255), index=True)
    expanded: Mapped[bool] = mapped_column(Boolean, default=False)

    folders: Mapped[List["Folder"]] = relationship(
        "Folder", back_populates="collection", cascade="all, delete-orphan", passive_deletes=True
    )
    requests: Mapped[List["Request"]] = relationship(
        "Request", back_populates="collection", cascade="all, delete-orphan", passive_deletes=True
    )

class Folder(Base, BaseModelMixin):
    __tablename__ = "folders"
    __table_args__ = (CheckConstraint("length(name) > 0", name="chk_folders_name_not_empty"),)

    name: Mapped[str] = mapped_column(String(255), index=True)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id", ondelete="CASCADE"), index=True)
    expanded: Mapped[bool] = mapped_column(Boolean, default=False)

    collection: Mapped["Collection"] = relationship("Collection", back_populates="folders")
    requests: Mapped[List["Request"]] = relationship(
        "Request", back_populates="folder", cascade="all, delete-orphan", passive_deletes=True
    )
