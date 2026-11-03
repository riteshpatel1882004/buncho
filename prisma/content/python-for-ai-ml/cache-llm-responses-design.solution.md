```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_response(prompt):
    return call_llm(prompt)    # call_llm is your API wrapper
```

Fine for a demo, but production caching must consider:
- **Prompt version** and **model version**.
- **Temperature** and other generation parameters (non-deterministic outputs).
- **User authorization** (never serve one user's answer to another).
- **Expiration (TTL)**.
- **Sensitive data**.
- **Token and cost limits**, and a shared store (Redis) for multiple workers.
