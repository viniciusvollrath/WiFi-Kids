# api/core/settings.py
import os
from typing import List
from zoneinfo import ZoneInfo

def _getenv(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v is not None and v != "" else default

def _parse_bool(v: str) -> bool:
    return str(v).strip().lower() in {"1", "true", "yes", "on"}

def _parse_int(v: str, default: int) -> int:
    try:
        return int(v)
    except Exception:
        return default

def _parse_float(v: str, default: float) -> float:
    try:
        return float(v)
    except Exception:
        return default

def _parse_cors(origins: str) -> List[str]:
    # "https://app.wifikids.com,http://localhost:5173"
    return [o.strip() for o in origins.split(",") if o.strip()]

# === Leitura das variáveis de ambiente (.env em dev) ===
DEFAULT_TIMEZONE = _getenv("DEFAULT_TIMEZONE", "America/Sao_Paulo")
ACCESS_WINDOWS   = _getenv("ACCESS_WINDOWS", "07:00-21:00")
SESSION_TTL_SEC  = _parse_int(_getenv("SESSION_TTL_SEC", "900"), 900)
CHALLENGE_REQUIRED = _parse_bool(_getenv("CHALLENGE_REQUIRED", "true"))
CHALLENGE_ATTEMPTS = _parse_int(_getenv("CHALLENGE_ATTEMPTS", "2"), 2)
CORS_ORIGINS = _parse_cors(_getenv("CORS_ORIGINS", "https://app.wifikids.com,http://localhost:5173"))

# usado pela app; Alembic usa alembic.ini
DATABASE_URL = _getenv("DATABASE_URL", "sqlite:///./dev.db")

# === OpenAI Configuration ===
OPENAI_API_KEY = _getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = _getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_TEMPERATURE = _parse_float(_getenv("OPENAI_TEMPERATURE", "0.3"), 0.3)
OPENAI_MAX_TOKENS = _parse_int(_getenv("OPENAI_MAX_TOKENS", "1000"), 1000)

# === Agent Configuration ===
AGENT_TYPE = _getenv("AGENT_TYPE", "langchain")  # "langchain" or "mock"
AGENT_DEFAULT_PERSONA = _getenv("AGENT_DEFAULT_PERSONA", "tutor")
AGENT_SUBJECTS = _getenv("AGENT_SUBJECTS", "math,history,geography,english,physics").split(",")
AGENT_FALLBACK_ENABLED = _parse_bool(_getenv("AGENT_FALLBACK_ENABLED", "true"))

# === Router Configuration ===
ROUTER_ENABLED = _parse_bool(_getenv("ROUTER_ENABLED", "true"))
ROUTER_PREFER_LLM = _getenv("ROUTER_PREFER_LLM", "openai")  # "openai", "anthropic", "google"
ROUTER_FALLBACK_TO_MOCK = _parse_bool(_getenv("ROUTER_FALLBACK_TO_MOCK", "true"))

# === Validation Configuration ===
VALIDATION_ENABLE_PARTIAL_CREDIT = _parse_bool(_getenv("VALIDATION_ENABLE_PARTIAL_CREDIT", "true"))
VALIDATION_CASE_SENSITIVE = _parse_bool(_getenv("VALIDATION_CASE_SENSITIVE", "false"))
VALIDATION_IGNORE_WHITESPACE = _parse_bool(_getenv("VALIDATION_IGNORE_WHITESPACE", "true"))
VALIDATION_DEFAULT_THRESHOLD = _parse_float(_getenv("VALIDATION_DEFAULT_THRESHOLD", "0.75"), 0.75)

# Objetos utilitários já resolvidos
TZ = ZoneInfo(DEFAULT_TIMEZONE)
