Vectorization applies an operation to a whole array at once instead of looping over elements in Python.

```python
import numpy as np

a, b = [1, 2, 3], [4, 5, 6]
print([x + y for x, y in zip(a, b)])   # [5, 7, 9]

a, b = np.array([1, 2, 3]), np.array([4, 5, 6])
print(a + b)                            # [5 7 9]
```

The NumPy loop runs in optimized compiled code, avoiding Python interpreter overhead per element.
