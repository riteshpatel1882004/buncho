```python
from functools import partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)     # arguments pre-filled
print(square(5))                        # 25

class Model:
    __slots__ = ("_lr",)                # no per-instance __dict__: less memory

    def __init__(self, lr):
        self._lr = lr

    @property
    def lr(self):                       # managed attribute access
        return self._lr

    @lr.setter
    def lr(self, value):
        if value <= 0:
            raise ValueError("lr must be positive")
        self._lr = value

m = Model(0.1)
m.lr = 0.05
print(m.lr)
```

- `partial`: new function with some arguments fixed.
- `property`: getter/setter logic behind plain attribute syntax.
- `__slots__`: restricts attributes and stores them compactly (helpful for millions of small objects).
