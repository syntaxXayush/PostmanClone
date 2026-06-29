class ServiceError(Exception):
    """Base class for service exceptions."""
    pass

class RequestExecutionError(ServiceError):
    """Raised when HTTP execution fails."""
    pass

class VariableResolutionError(ServiceError):
    """Raised when variable resolution fails."""
    pass

class EnvironmentNotFoundError(ServiceError):
    """Raised when environment lookup fails."""
    pass

class CollectionNotFoundError(ServiceError):
    """Raised when collection lookup fails."""
    pass

class FolderNotFoundError(ServiceError):
    """Raised when folder lookup fails."""
    pass

class RequestNotFoundError(ServiceError):
    """Raised when request lookup fails."""
    pass
