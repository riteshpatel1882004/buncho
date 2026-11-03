**Likely causes**
- Prediction outputs kept in a global list.
- References to large arrays.
- PyTorch computation graphs retained (storing tensors that require grad).
- **Unbounded caches**.
- Unclosed files or network resources.
- Logs or request data accumulating in memory.

```python
from collections import deque
from functools import lru_cache

history = []                       # BUG: grows forever
def predict_leaky(x):
    history.append(x)
    return x

recent = deque(maxlen=100)         # fix: bounded
def predict_bounded(x):
    recent.append(x)
    return x

@lru_cache(maxsize=1000)           # fix: bounded cache
def cached(x):
    return x * 2
```

**Find it:** reproduce with repeated requests, then profile with `tracemalloc` (compare snapshots) or `memory_profiler`.
