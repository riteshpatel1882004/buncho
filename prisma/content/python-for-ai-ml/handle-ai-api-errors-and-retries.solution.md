```python
import requests

try:
    response = requests.post(
        "https://api.example.com/predict",
        json={"text": "Hello"},
        timeout=10,            # always set a timeout
    )
    response.raise_for_status()
    result = response.json()
except requests.Timeout:
    print("Request timed out")
except requests.HTTPError as e:
    print("HTTP error:", e)
except requests.RequestException as e:
    print("Request failed:", e)
```

**Retries: no, not everything.** Retry transient failures (timeouts, 429 rate limits, some 5xx) with **exponential backoff and jitter**. Do not retry invalid requests (400) or permanent auth failures (401/403).
