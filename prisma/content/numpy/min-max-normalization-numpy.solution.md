Formula: `(X - min) / (max - min)`.

```python
import numpy as np

def normalize(X):
    minimum, maximum = X.min(), X.max()
    if maximum == minimum:
        return np.zeros_like(X, dtype=float)
    return (X - minimum) / (maximum - minimum)

print(normalize(np.array([10, 20, 30])))   # [0.  0.5 1. ]
```

**Leakage:** compute `min`/`max` on the **training data only** and reuse them for validation and test data. (scikit-learn's `MinMaxScaler.fit` on train, `transform` on test.)
