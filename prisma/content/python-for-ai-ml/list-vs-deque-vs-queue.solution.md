- **`list`:** dynamic array. Fast indexing and append; `pop(0)` / `insert(0, x)` are O(n).
- **`collections.deque`:** O(1) append/pop at **both ends**. Good for sliding windows and BFS.
- **`queue.Queue`:** **thread-safe** queue with blocking `get`/`put`, for producer-consumer patterns.

```python
from collections import deque

q = deque()
q.append(10)
q.append(20)
print(q.popleft())   # 10
```
