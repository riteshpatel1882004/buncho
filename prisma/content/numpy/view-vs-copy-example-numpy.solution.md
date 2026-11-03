A **view** shares the underlying data with the original. A **copy** owns independent data.

```python
import numpy as np

a = np.array([1, 2, 3, 4])
view = a.view()
copy = a.copy()
view[0] = 100
print(a)      # [100   2   3   4]
print(copy)   # [1 2 3 4]
```

Basic slicing returns a view; boolean and fancy indexing return copies. Check with `np.shares_memory(a, b)`. Use `.copy()` when you must not modify the original.
