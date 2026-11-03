**Middleware** wraps every request/response, before it reaches the endpoint and after it leaves. Typical uses: authentication, request logging, CORS, timing, rate limiting.

```python
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["https://myapp.com"],
                   allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
    return response
```

**CORS** (Cross-Origin Resource Sharing) is a **browser** security mechanism that controls whether a page from one origin may call an API on another. The server opts in with headers; list specific origins instead of `"*"` for authenticated APIs. It does not protect the API from non-browser clients.

**Authentication vs authorization**
- Authentication: *who are you?* (login, API key, JWT)
- Authorization: *what may you access?* (roles, permissions)

A 401 means "not authenticated", a 403 means "authenticated but not allowed".
