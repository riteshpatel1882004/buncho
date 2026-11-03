- `raise` always raises the exception you give it.
- `assert` checks a condition for debugging and is **removed when Python runs with `-O`**.

```python
model = None
data = [1, 2]

if model is None:
    print("would raise ValueError")   # production check: raise ValueError(...)

assert len(data) > 0                  # sanity check for developers
```

Do not use `assert` for input validation or security checks, because they can be silently disabled.
