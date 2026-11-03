```python
class FileManager:
    def __init__(self, filename):
        self.filename = filename

    def __enter__(self):
        self.file = open(self.filename, "r")
        return self.file

    def __exit__(self, exc_type, exc_value, traceback):
        self.file.close()
        return False   # do not suppress exceptions

with open("data.txt", "w") as f:
    f.write("hello")

with FileManager("data.txt") as f:
    print(f.read())
```

`__exit__` receives the exception type, value and traceback (all `None` if no error). Returning `True` suppresses the exception; return `False` unless you mean to. Shortcut: `@contextlib.contextmanager` on a generator.
