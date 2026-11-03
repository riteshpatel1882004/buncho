- `a.reshape(shape)` returns an array with a new shape, **usually a view** (the element count must match).
- `np.resize(a, shape)` returns a new array and **repeats elements** if needed.
- `a.resize(shape)` modifies the array **in place** (under specific conditions).

```python
import numpy as np

a = np.array([1, 2, 3, 4])
print(a.reshape(2, 2))
print(np.resize(a, (3, 3)))   # repeats 1, 2, 3, 4, 1, ...
```
