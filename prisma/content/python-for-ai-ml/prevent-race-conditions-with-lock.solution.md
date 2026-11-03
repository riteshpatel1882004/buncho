Use synchronization primitives: **Lock**, **Semaphore**, **Event**, **Condition**, or a thread-safe **Queue**.

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(10_000):
        with lock:
            counter += 1

threads = [threading.Thread(target=increment) for _ in range(4)]
[t.start() for t in threads]
[t.join() for t in threads]
print(counter)   # 40000
```

Even better: avoid shared state by passing messages through a `queue.Queue`.
