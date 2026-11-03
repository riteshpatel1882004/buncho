```python
def predict_in_batches(model, X, batch_size=32):
    predictions = []
    for start in range(0, len(X), batch_size):
        batch = X[start:start + batch_size]
        predictions.extend(model.predict(batch))
    return predictions

class Dummy:
    def predict(self, batch):
        return [x * 2 for x in batch]

print(predict_in_batches(Dummy(), list(range(5)), batch_size=2))   # [0, 2, 4, 6, 8]
```

Useful when the whole dataset (or GPU memory) cannot handle one call. For deep learning, wrap it in `torch.inference_mode()`.
