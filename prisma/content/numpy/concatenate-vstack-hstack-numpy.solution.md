```python
import numpy as np

a = np.array([[1, 2]])
b = np.array([[3, 4]])
print(np.concatenate((a, b), axis=0))   # [[1 2] [3 4]]
print(np.vstack((a, b)))                # [[1 2] [3 4]]
print(np.hstack((a, b)))                # [[1 2 3 4]]
```

- `concatenate`: joins along an **existing axis** you choose.
- `vstack`: stacks vertically (axis 0).
- `hstack`: stacks horizontally (axis 1 for 2D).

All return a new array. Shapes must match on the other axes.
