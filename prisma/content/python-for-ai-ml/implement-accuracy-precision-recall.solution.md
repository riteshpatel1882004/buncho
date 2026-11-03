```python
def classification_metrics(y_true, y_pred):
    pairs = list(zip(y_true, y_pred))
    tp = sum(a == 1 and b == 1 for a, b in pairs)
    tn = sum(a == 0 and b == 0 for a, b in pairs)
    fp = sum(a == 0 and b == 1 for a, b in pairs)
    fn = sum(a == 1 and b == 0 for a, b in pairs)

    accuracy = (tp + tn) / len(y_true)
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    return accuracy, precision, recall

print(classification_metrics([1, 0, 1, 1], [1, 0, 0, 1]))   # (0.75, 1.0, 0.666...)
```

Precision = TP / (TP + FP); recall = TP / (TP + FN). On imbalanced data accuracy alone is misleading.
