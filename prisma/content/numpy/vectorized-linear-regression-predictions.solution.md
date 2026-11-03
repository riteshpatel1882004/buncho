```python
import numpy as np

X = np.array([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]])   # (n_samples, n_features)
weights = np.array([0.5, -1.0])                       # (n_features,)
bias = 0.1

predictions = X @ weights + bias                      # (n_samples,)
print(predictions)
```

One matrix multiplication replaces the loop. It is shorter and much faster, and the same pattern scales to batches in neural networks.
