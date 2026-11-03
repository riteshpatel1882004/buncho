| Python list | NumPy array |
|---|---|
| Can hold mixed types | Usually one dtype |
| No element-wise arithmetic | Vectorized arithmetic |
| References to objects (more overhead) | Compact, contiguous values |
| General purpose | Numerical computing |

```python
import numpy as np
print([1, 2] * 2)            # [1, 2, 1, 2]
print(np.array([1, 2]) * 2)  # [2 4]
```
