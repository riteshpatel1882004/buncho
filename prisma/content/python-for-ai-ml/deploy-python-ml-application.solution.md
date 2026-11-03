1. Develop and test the model.
2. Save the model artifacts (versioned).
3. Build an inference API (FastAPI).
4. Pin dependencies (`requirements.txt` or a lock file).
5. Containerize with Docker.
6. Configure environment variables and secrets (never bake keys into the image).
7. Deploy to a cloud platform.
8. Add health checks, logging and monitoring.
9. Track latency, error rate and resource usage.

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Load the model once at startup, and add a `/health` endpoint for the orchestrator.
