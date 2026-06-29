from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = Field(default=True, description="Indicates if the request was successful")
    data: Optional[T] = Field(default=None, description="The payload of the response")

class ErrorResponse(BaseModel):
    success: bool = Field(default=False, description="Indicates if the request was successful")
    message: str = Field(..., description="A user-friendly error message")
    error_code: str = Field(..., description="A machine-readable error code")
    details: Optional[Any] = Field(default=None, description="Additional error details")

class PaginatedResponse(SuccessResponse[T], Generic[T]):
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Number of items per page")
