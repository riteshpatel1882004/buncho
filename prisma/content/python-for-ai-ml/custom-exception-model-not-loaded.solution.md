```python
class ModelNotLoadedError(Exception):
    pass

def predict(model):
    if model is None:
        raise ModelNotLoadedError("Model is not loaded")
    return model.predict()

try:
    predict(None)
except ModelNotLoadedError as e:
    print("caught:", e)
```

Custom exceptions give callers something precise to catch, instead of matching on error strings. Inherit from `Exception`, not `BaseException`.
