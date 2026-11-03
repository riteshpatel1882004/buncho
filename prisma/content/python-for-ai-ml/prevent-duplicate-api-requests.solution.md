Use **idempotency keys / request IDs**, **caching** and **request deduplication** (collapse identical in-flight requests).

For embeddings, derive the cache key from the **normalized text + model name + model version**:

```python
import hashlib

def cache_key(text, model="emb-v1"):
    normalized = " ".join(text.lower().split())
    return hashlib.sha256(f"{model}:{normalized}".encode()).hexdigest()

print(cache_key("Hello  World") == cache_key("hello world"))   # True
```

For writes (payments, jobs), send an idempotency key so retries do not create duplicates.
