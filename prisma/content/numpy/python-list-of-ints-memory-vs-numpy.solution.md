A list stores **references** to separate Python objects, and each `int` object has its own header (around 28 bytes). NumPy stores raw values **packed** in one buffer.

```python
import sys
import numpy as np

n = 1_000_000
lst = list(range(n))
arr = np.arange(n, dtype=np.int32)

list_bytes = sys.getsizeof(lst) + sum(sys.getsizeof(i) for i in lst)
print(list_bytes, arr.nbytes)   # tens of MB vs 4 MB
```

Choose a smaller dtype (`int32`, `float32`) when the range allows.
