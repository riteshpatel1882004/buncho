```python
from collections import defaultdict, Counter
import heapq, itertools

groups = defaultdict(list)                  # missing key -> new empty list
for word in ["apple", "avocado", "banana"]:
    groups[word[0]].append(word)
print(dict(groups))

print(Counter("banana").most_common(1))     # frequency counting

heap = []
for x in [5, 1, 3]:
    heapq.heappush(heap, x)
print(heapq.heappop(heap))                  # 1: smallest first (min-heap)

print(list(itertools.islice(itertools.count(10), 3)))   # [10, 11, 12]
print(list(itertools.chain([1, 2], [3])))               # [1, 2, 3]
print(list(itertools.combinations("abc", 2)))
```

- `defaultdict`: dict with a default factory.
- `Counter`: frequency-counting dict.
- `heapq`: heap / priority queue.
- `itertools`: efficient, lazy iterator utilities.
