```python
import numpy as np

def mae(y_true, y_pred):
    return np.mean(np.abs(np.asarray(y_true) - np.asarray(y_pred)))

print(mae([1, 2, 3], [1, 2, 5]))   # 0.6667
```

MAE is in the same units as the target and is more robust to outliers than MSE.
