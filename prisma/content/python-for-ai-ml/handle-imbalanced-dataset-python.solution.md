**Methods**
- **Class weights** (`class_weight="balanced"`).
- Random **oversampling** / **undersampling**.
- **SMOTE** (imbalanced-learn).
- **Stratified** train/test split.
- Threshold tuning.

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

X = np.random.default_rng(0).normal(size=(200, 2))
y = (X[:, 0] > 1.2).astype(int)           # rare positive class
X_tr, X_te, y_tr, y_te = train_test_split(X, y, stratify=y, random_state=0)
clf = LogisticRegression(class_weight="balanced").fit(X_tr, y_tr)
```

**Evaluate** with precision, recall, F1, **PR-AUC** and a confusion matrix, not accuracy alone. Resample the **training set only**, never the test set.
