**Data leakage:** information that would not be available at prediction time influences training or evaluation, giving unrealistically good scores.

Wrong: computing mean/std (or min/max) on the **whole** dataset before splitting, so test statistics leak into training.

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X = np.random.default_rng(0).normal(size=(100, 3))
y = (X[:, 0] > 0).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)   # fit on train only
X_test = scaler.transform(X_test)         # reuse train statistics
```

Never fit preprocessing on test data. A `Pipeline` makes this automatic, including inside cross-validation.
