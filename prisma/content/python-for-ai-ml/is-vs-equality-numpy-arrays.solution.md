- `==` compares **values** (calls `__eq__`).
- `is` compares **identity**: whether both names point to the same object.

```python
a = [1, 2, 3]
b = [1, 2, 3]
print(a == b)   # True
print(a is b)   # False: two different objects
```

**NumPy:** `==` is element-wise and returns a boolean *array*, so `if a == b:` raises "truth value of an array is ambiguous".

```python
import numpy as np

x, y = np.array([1, 2, 3]), np.array([1, 2, 3])
print(np.array_equal(x, y))   # True: whole-array equality
print(np.allclose(x, y))      # True: use for floats (tolerance)
```

Use `is` only for singletons such as `x is None`.
