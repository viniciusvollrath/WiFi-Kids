FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY pyproject.toml /app/
RUN pip install --upgrade pip && \
    pip install "uvicorn[standard]" "fastapi" "pydantic" "redis" "httpx" \
                "langchain" "langchain-openai" "pydantic-settings" "supabase"

COPY app /app/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
