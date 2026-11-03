```python
def with_return():
    return [1, 2, 3]       # builds everything, function ends

def with_yield():
    yield 1                # pauses, keeps state
    yield 2
    yield 3

print(with_return())       # [1, 2, 3]
print(list(with_yield()))  # [1, 2, 3]
```

| `yield` | `return` |
|---|---|
| Produces a generator | Returns a final result |
| Preserves function state | Ends function execution |
| Supports lazy evaluation | No lazy iteration by itself |
| Can produce many values | Returns one result |
