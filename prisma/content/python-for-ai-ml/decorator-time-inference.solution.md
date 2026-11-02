A **decorator** wraps a function to add behaviour without changing its code.

```python
import time
from functools import wraps

def measure_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__}: {time.perf_counter() - start:.4f}s")
        return result
    return wrapper

@measure_time
def predict(x):
    return x * 2

predict(21)
```

`@wraps(func)` keeps the original `__name__` and docstring, which matters for logs, debugging and frameworks that inspect function metadata. Accept `*args, **kwargs` so the wrapper works for any signature.
