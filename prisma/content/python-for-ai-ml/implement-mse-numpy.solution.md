```python
import numpy as np

def mse(y_true, y_pred):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    return np.mean((y_true - y_pred) ** 2)

print(mse([1, 2, 3], [1, 2, 5]))   # 1.3333
```

MSE penalizes large errors more than MAE, so it is more sensitive to outliers.
