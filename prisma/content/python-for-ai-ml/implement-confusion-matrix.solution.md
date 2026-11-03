```python
import numpy as np

def confusion_matrix_manual(y_true, y_pred):
    classes = sorted(set(y_true) | set(y_pred))
    mapping = {label: i for i, label in enumerate(classes)}
    matrix = np.zeros((len(classes), len(classes)), dtype=int)
    for actual, predicted in zip(y_true, y_pred):
        matrix[mapping[actual], mapping[predicted]] += 1
    return matrix

print(confusion_matrix_manual([0, 1, 1, 2], [0, 1, 2, 2]))
```

**Rows = actual classes, columns = predicted classes.** The diagonal holds correct predictions.
