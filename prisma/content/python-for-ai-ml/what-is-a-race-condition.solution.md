A race condition occurs when threads or processes access **shared state** and the result depends on the **order of execution**.

Example: two threads run `counter += 1`. It is really read, add, write. Both can read the same value, so one update is lost.

```python
import threading

counter = 0

def increment():
    global counter
    for _ in range(100_000):
        counter += 1     # not atomic

threads = [threading.Thread(target=increment) for _ in range(4)]
[t.start() for t in threads]
[t.join() for t in threads]
print(counter)           # may be less than 400000
```
