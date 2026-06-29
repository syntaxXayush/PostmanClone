from sqlalchemy import String, Integer, Boolean, ForeignKey, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Any, TYPE_CHECKING
from app.models.base import Base, BaseModelMixin

if TYPE_CHECKING:
    from app.models.collections import Collection, Folder

class Request(Base, BaseModelMixin):
    __tablename__ = "requests"
    __table_args__ = (
        CheckConstraint("length(method) > 0", name="chk_requests_method_not_empty"),
        CheckConstraint("length(url) > 0", name="chk_requests_url_not_empty"),
        CheckConstraint("method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')", name="chk_requests_method_valid"),
    )

    name: Mapped[str] = mapped_column(String(255), index=True)
    method: Mapped[str] = mapped_column(String(20), index=True)
    url: Mapped[str] = mapped_column(String(2048))
    
    body_type: Mapped[str] = mapped_column(String(50), default="none")
    raw_body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    timeout: Mapped[int] = mapped_column(Integer, default=30000) # milliseconds
    follow_redirects: Mapped[bool] = mapped_column(Boolean, default=True)
    verify_ssl: Mapped[bool] = mapped_column(Boolean, default=True)

    collection_id: Mapped[Optional[int]] = mapped_column(ForeignKey("collections.id", ondelete="CASCADE"), index=True, nullable=True)
    folder_id: Mapped[Optional[int]] = mapped_column(ForeignKey("folders.id", ondelete="CASCADE"), index=True, nullable=True)

    # JSON fields for flexible structure
    headers: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    params: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    auth: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    form_data: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    
    scripts: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tests: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    collection: Mapped[Optional["Collection"]] = relationship("Collection", back_populates="requests")
    folder: Mapped[Optional["Folder"]] = relationship("Folder", back_populates="requests")
