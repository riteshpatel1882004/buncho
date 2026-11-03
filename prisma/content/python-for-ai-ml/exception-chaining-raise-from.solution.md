It keeps the original exception attached when you raise a different one.

```python
try:
    result = 10 / 0
except ZeroDivisionError as e:
    raise RuntimeError("Prediction failed") from e
```

The traceback shows both errors, and the original is available as `__cause__`. Use it to expose a meaningful application-level error without losing the underlying cause.
