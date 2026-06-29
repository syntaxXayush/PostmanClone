import re
from typing import Any, Dict, List, Union
from app.services.exceptions import VariableResolutionError
import logging

logger = logging.getLogger(__name__)

class VariableResolverService:
    PATTERN = re.compile(r"\{\{([^}]+)\}\}")

    def resolve(self, target: Any, variables: Dict[str, str]) -> Any:
        """
        Recursively resolves {{variable}} syntax in target.
        """
        try:
            if isinstance(target, str):
                return self._resolve_string(target, variables)
            elif isinstance(target, dict):
                return {k: self.resolve(v, variables) for k, v in target.items()}
            elif isinstance(target, list):
                return [self.resolve(item, variables) for item in target]
            return target
        except Exception as e:
            logger.error(f"Variable resolution failed for {target}: {e}")
            raise VariableResolutionError(f"Variable resolution failed: {str(e)}") from e

    def _resolve_string(self, value: str, variables: Dict[str, str]) -> str:
        def replacer(match: re.Match) -> str:
            var_name = match.group(1).strip()
            # If variable not found, leave it unresolved or replace with empty?
            # Standard postman leaves it unresolved or empty. We will replace with empty string or raise?
            # We'll replace with the mapped value if it exists, otherwise keep it or replace with empty.
            # Let's replace with the variable value if available, else empty string.
            return variables.get(var_name, "")
            
        return self.PATTERN.sub(replacer, value)

variable_resolver_service = VariableResolverService()
