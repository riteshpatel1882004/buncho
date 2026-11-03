```python
import numpy as np

def train_test_split_manual(X, y, test_size=0.2, seed=42):
    X, y = np.asarray(X), np.asarray(y)
    rng = np.random.default_rng(seed)
    indices = rng.permutation(len(X))
    split = int(len(X) * (1 - test_size))
    train_idx, test_idx = indices[:split], indices[split:]
    return X[train_idx], X[test_idx], y[train_idx], y[test_idx]

X_tr, X_te, y_tr, y_te = train_test_split_manual(np.arange(10), np.arange(10))
print(len(X_tr), len(X_te))   # 8 2
```

A fixed seed makes it reproducible. For classification use a **stratified** split, and for time series split by time (no shuffling).
