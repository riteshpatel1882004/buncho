- `__new__(cls, ...)` **creates** and returns the instance. It runs first.
- `__init__(self, ...)` **initializes** the already-created instance.

```python
class Singleton:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

print(Singleton() is Singleton())   # True
```

Override `__new__` for immutable types (`int`, `tuple`, `str` subclasses) and for patterns that control creation, such as singletons.
