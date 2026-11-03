**Latency: measure first**, then apply what the profile points to:
- Load the model **once at startup**, not per request.
- **Batch** requests (dynamic batching).
- **Cache** repeated inputs.
- Optimize preprocessing and avoid needless serialization.
- Use smaller or **quantized** models; use a GPU if it helps.
- Use async I/O for external dependencies.

```python
import time
from contextlib import contextmanager

@contextmanager
def timed(label):
    start = time.perf_counter()
    yield
    print(f"{label}: {(time.perf_counter() - start) * 1000:.1f} ms")

with timed("preprocess"):
    sum(range(100_000))
```

**Concurrency**
- Choose an appropriate server setup (workers/threads) and set **request limits and timeouts**.
- Batch where it helps throughput.
- Do **not** load a separate model copy in every worker if memory is tight; watch GPU memory.
- Add a queue or back-pressure (return 429/503) instead of letting latency grow without bound.
