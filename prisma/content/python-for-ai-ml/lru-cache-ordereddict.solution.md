```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)          # mark as most recently used
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)   # evict least recently used

c = LRUCache(2)
c.put(1, "a"); c.put(2, "b"); c.get(1); c.put(3, "c")
print(c.get(2), c.get(1))   # -1 a
```

`get` and `put` are **O(1)** average.
