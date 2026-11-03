Broadcasting lets arrays of different but compatible shapes be used in arithmetic without copying data.

```python
import numpy as np

a = np.array([[1, 2, 3], [4, 5, 6]])
b = np.array([10, 20, 30])
print(a + b)
# [[11 22 33]
#  [14 25 36]]
```

**Rules:** compare shapes from the **right**. Two dimensions are compatible if they are **equal or one is 1**. Missing leading dimensions are treated as 1. `(2, 3)` and `(3,)` become `(2, 3)` and `(1, 3)`, so the row is stretched.
