class RepositoryError(Exception):
    """Base class for repository exceptions."""
    pass

class NotFoundError(RepositoryError):
    """Raised when an entity is not found."""
    pass

class DuplicateError(RepositoryError):
    """Raised when an entity violates unique constraints."""
    pass
