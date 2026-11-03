```python
import numpy as np

class LinearRegression:
    def __init__(self, lr=0.01, epochs=1000):
        self.lr = lr
        self.epochs = epochs

    def fit(self, X, y):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)
        n, features = X.shape
        self.weights = np.zeros(features)
        self.bias = 0.0
        for _ in range(self.epochs):
            predictions = X @ self.weights + self.bias
            dw = (2 / n) * X.T @ (predictions - y)
            db = (2 / n) * np.sum(predictions - y)
            self.weights -= self.lr * dw
            self.bias -= self.lr * db
        return self

    def predict(self, X):
        return np.asarray(X) @ self.weights + self.bias

X = np.array([[1], [2], [3], [4]])
y = np.array([3, 5, 7, 9])               # y = 2x + 1
m = LinearRegression(lr=0.05, epochs=2000).fit(X, y)
print(m.weights, m.bias)                  # about [2.] 1.
```

**Follow-ups**
- **Zero init:** fine for linear regression (convex loss). For neural networks it breaks symmetry, so use random init.
- **LR too high:** loss oscillates or diverges. **Too low:** very slow convergence.
- **Divide by n:** averages the gradient so its scale does not depend on dataset size.
- **Feature scaling:** keeps gradients balanced so training converges faster and a single LR works.
- **Batch GD** uses all rows per step; **SGD** one row; **mini-batch** a small subset (the common compromise).
