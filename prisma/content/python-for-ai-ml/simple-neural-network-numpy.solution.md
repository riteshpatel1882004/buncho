First **clarify** whether the interviewer wants NumPy, PyTorch or pseudocode. A tiny NumPy network shows forward propagation and backpropagation.

```python
import numpy as np

rng = np.random.default_rng(0)
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
y = np.array([[0], [1], [1], [0]], dtype=float)           # XOR

W1, b1 = rng.normal(size=(2, 8)), np.zeros(8)
W2, b2 = rng.normal(size=(8, 1)), np.zeros(1)
sigmoid = lambda z: 1 / (1 + np.exp(-z))

for _ in range(5000):
    h = np.tanh(X @ W1 + b1)                  # forward
    p = sigmoid(h @ W2 + b2)
    dp = (p - y) / len(X)                     # BCE + sigmoid gradient
    dW2, db2 = h.T @ dp, dp.sum(0)            # backward
    dh = (dp @ W2.T) * (1 - h ** 2)
    dW1, db1 = X.T @ dh, dh.sum(0)
    W1 -= 0.5 * dW1; b1 -= 0.5 * db1
    W2 -= 0.5 * dW2; b2 -= 0.5 * db2

print(p.round(2).ravel())   # close to [0 1 1 0]
```

Steps: initialize weights randomly, forward pass, loss, backward pass (chain rule), update. In practice use PyTorch autograd.
