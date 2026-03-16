FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY hub_api/ ./hub_api/

EXPOSE 8003

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8003/api/health || exit 1

CMD ["uvicorn", "hub_api.main:app", "--host", "0.0.0.0", "--port", "8003"]
