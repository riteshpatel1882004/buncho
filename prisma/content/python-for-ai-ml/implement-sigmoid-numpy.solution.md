```python
import numpy as np

def sigmoid(x):
    x = np.asarray(x, dtype=float)
    return 1 / (1 + np.exp(-np.clip(x, -500, 500)))

print(sigmoid([-1000, 0, 1000]))   # [~0, 0.5, 1.0]  (tiny, 0.5, 1)
```

For very negative `x`, `exp(-x)` overflows to `inf` and triggers warnings. Clipping avoids that. (`scipy.special.expit` is a ready-made stable version.)
