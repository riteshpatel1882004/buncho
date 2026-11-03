```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.requests = deque()

    def allow_request(self):
        now = time.monotonic()
        while self.requests and now - self.requests[0] >= self.window:
            self.requests.popleft()
        if len(self.requests) >= self.limit:
            return False
        self.requests.append(now)
        return True

rl = RateLimiter(limit=2, window=1)
print([rl.allow_request() for _ in range(3)])   # [True, True, False]
```

**Limitations:** process-local and **not thread-safe** (add a lock). A multi-instance service needs a shared store such as **Redis**. Token bucket allows controlled bursts.
