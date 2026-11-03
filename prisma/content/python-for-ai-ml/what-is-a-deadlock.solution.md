A deadlock occurs when two or more threads wait forever for resources held by each other (thread 1 holds lock A and waits for B, thread 2 holds B and waits for A).

**Avoid it by:**
- Always acquiring locks in the **same order**.
- Keeping lock scope small.
- Using **timeouts**.
- Avoiding nested locks when possible.

```python
import threading

a, b = threading.Lock(), threading.Lock()

def task():
    if a.acquire(timeout=1):
        try:
            if b.acquire(timeout=1):   # consistent order: a then b
                b.release()
        finally:
            a.release()

task()
```
