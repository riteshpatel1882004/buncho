```python
from collections import Counter
import heapq

def top_k_frequent(nums, k):
    count = Counter(nums)
    return heapq.nlargest(k, count.keys(), key=count.get)

print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))   # [1, 2]
```

Counting is O(n); `heapq.nlargest` is **O(n log k)** (a sort would be O(n log n)). A bucket-sort by frequency gives O(n).
