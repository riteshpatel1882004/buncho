`super()` gives access to the next class in the MRO, most commonly used to run the parent's method.

```python
class Base:
    def __init__(self):
        print("Base initialized")

class Model(Base):
    def __init__(self):
        super().__init__()
        print("Model initialized")

Model()
```

If you skip `super().__init__()`, the parent's attributes are never set, causing `AttributeError` later. In multiple inheritance, `super()` follows the MRO, not just the direct parent.
