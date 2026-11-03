Formula: `sqrt(sum((x_i - y_i)^2))`.

```python
import numpy as np

a = np.array([1, 2])
b = np.array([4, 6])
print(np.linalg.norm(a - b))   # 5.0
```

Used in KNN, k-means clustering and other similarity or nearest-neighbour computations. Scale features first, otherwise large-range features dominate the distance.
