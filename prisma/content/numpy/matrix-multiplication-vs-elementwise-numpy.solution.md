```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(A @ B)   # [[19 22] [43 50]]  matrix multiplication
print(A * B)   # [[ 5 12] [21 32]]  element-wise
```

`@` (or `np.matmul`) is matrix multiplication; `*` is element-wise. The inner dimensions must match: `(m, n) @ (n, p) -> (m, p)`.
