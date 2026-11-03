```python
import numpy as np
from collections import Counter

class KNN:
    def __init__(self, k=3):
        self.k = k

    def fit(self, X, y):
        self.X = np.asarray(X)
        self.y = np.asarray(y)
        return self

    def predict_one(self, point):
        distances = np.linalg.norm(self.X - point, axis=1)
        indices = np.argsort(distances)[:self.k]
        labels = self.y[indices]
        return Counter(labels).most_common(1)[0][0]

    def predict(self, X):
        return np.array([self.predict_one(p) for p in np.asarray(X)])

knn = KNN(k=3).fit([[0, 0], [0, 1], [5, 5], [6, 5]], [0, 0, 1, 1])
print(knn.predict([[0.2, 0.5], [5.5, 5.0]]))   # [0 1]
```

Training is free; prediction is O(n·d) per query. Scale features first, use an odd `k` for binary tasks, and use KD-trees or ANN indexes for large data.
