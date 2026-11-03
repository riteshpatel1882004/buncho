```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
print(a[a > 3])                # [4 5]       filters: shorter array
print(np.where(a > 3, 1, 0))   # [0 0 0 1 1] keeps shape, chooses values
print(np.where(a > 3))         # (array([3, 4]),) indices of matches
```

- **Boolean indexing** selects the elements that match (returns a copy).
- **`np.where(cond, x, y)`** picks `x` or `y` per element; with only `cond` it returns the matching indices.
