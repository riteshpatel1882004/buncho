```python
import numpy as np

rng = np.random.default_rng(seed=42)
print(rng.random(5))                  # 5 floats in [0, 1)
print(rng.integers(1, 100, size=5))   # 5 ints in [1, 100)
```

A fixed seed gives the same sequence for the same NumPy version and sequence of calls. Prefer `default_rng` over the legacy `np.random.seed`, and pass the generator explicitly.
