Memoization caches a function's results so identical inputs are not recomputed.

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))   # 55
```

**Embedding service:** yes, if inputs repeat. The key must include the **text, model name/version and preprocessing config**, otherwise stale or wrong vectors are returned after a change. Use an external cache (Redis) if there are multiple workers, and set a size limit or TTL.
