```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
print(a.shape)   # (2, 3)  dimensions
print(a.size)    # 6       total elements
print(a.ndim)    # 2       number of dimensions
print(a.dtype)   # int64 (platform dependent)
```

- `shape`: size of each dimension.
- `size`: total number of elements.
- `ndim`: number of dimensions.
- `dtype`: type of each element.
