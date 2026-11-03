```python
from collections import deque

class StackUsingQueue:                       # one queue
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1):     # rotate so newest is at the front
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()

class QueueUsingStacks:                      # two stacks
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x):
        self.inbox.append(x)

    def pop(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox.pop()

s = StackUsingQueue(); [s.push(i) for i in (1, 2, 3)]
q = QueueUsingStacks(); [q.push(i) for i in (1, 2, 3)]
print(s.pop(), q.pop())   # 3 1
```

Stack from queue: push O(n), pop O(1) (or the reverse). Queue from stacks: **amortized O(1)** for both, because each item moves between stacks at most once.
