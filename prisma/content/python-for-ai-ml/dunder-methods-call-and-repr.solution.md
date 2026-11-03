Dunder methods (double underscores) define how objects behave with Python syntax and built-ins.

| Method | Purpose |
|---|---|
| `__init__` | Initialize object |
| `__str__` / `__repr__` | Readable / developer representation |
| `__len__` | `len(obj)` |
| `__iter__` / `__next__` | Iteration |
| `__call__` | Make the object callable |
| `__eq__` | `==` |
| `__getitem__` | `obj[i]` |

```python
class Predictor:
    def __call__(self, data):
        return [0.9, 0.8, 0.7]

model = Predictor()
print(model([1, 2, 3]))   # same style as PyTorch modules
```
