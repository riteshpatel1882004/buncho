```python
import numpy as np

def softmax(x):
    x = np.asarray(x, dtype=float)
    exp_x = np.exp(x - np.max(x))
    return exp_x / np.sum(exp_x)

print(softmax([1000, 1001, 1002]))   # works; no overflow
print(softmax([1, 2, 3]).sum())      # 1.0
```

Softmax is unchanged by subtracting a constant, but it keeps the exponents <= 0, so `exp` cannot overflow.
