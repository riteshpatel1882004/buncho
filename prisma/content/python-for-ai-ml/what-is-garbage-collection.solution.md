Garbage collection finds objects that are no longer reachable and reclaims their memory. In CPython it mainly targets **reference cycles**, which reference counting cannot free.

```python
import gc

class Node:
    pass

a, b = Node(), Node()
a.other, b.other = b, a    # reference cycle
del a, b
print(gc.collect())        # frees the cycle, returns number found
```

Manual `gc.collect()` is rarely needed. It can help after releasing large cyclic structures, for example between experiments.
