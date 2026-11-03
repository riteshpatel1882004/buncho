```python
import time
import random

def retry_request(func, retries=3):
    for attempt in range(retries):
        try:
            return func()
        except Exception:
            if attempt == retries - 1:
                raise
            delay = 2 ** attempt + random.random()   # backoff + jitter
            time.sleep(delay)

calls = {"n": 0}
def flaky():
    calls["n"] += 1
    if calls["n"] < 2:
        raise RuntimeError("temporary")
    return "ok"

print(retry_request(flaky))
```

In production, catch **specific retryable** exceptions (timeouts, 429, selected 5xx), not bare `Exception`. Do not retry invalid requests or auth failures.
