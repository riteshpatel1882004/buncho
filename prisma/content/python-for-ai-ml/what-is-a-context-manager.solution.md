A context manager sets up a resource and guarantees cleanup, **even if an exception occurs**.

```python
with open("data.txt", "r") as file:
    content = file.read()
# file is closed here, even if read() raised
```

With manual `open()`/`close()`, an exception before `close()` leaks the file handle. The same pattern is used for locks, database connections and `torch.no_grad()`.
