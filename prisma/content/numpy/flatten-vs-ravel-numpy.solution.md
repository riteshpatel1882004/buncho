- `flatten()` **always returns a copy**.
- `ravel()` returns a flattened **view when possible**, otherwise a copy.

```python
import numpy as np

a = np.array([[1, 2], [3, 4]])
a.ravel()[0] = 99
print(a[0, 0])    # 99: ravel gave a view
a.flatten()[0] = -1
print(a[0, 0])    # 99: flatten copied
```
