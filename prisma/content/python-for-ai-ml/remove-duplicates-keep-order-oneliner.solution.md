```python
data = [1, 2, 2, 3, 4, 3, 5]
result = list(dict.fromkeys(data))
print(result)   # [1, 2, 3, 4, 5]
```

Dict keys are unique and keep insertion order (Python 3.7+), so the first occurrence of each item wins. O(n); items must be hashable.

`list(set(data))` removes duplicates but does not guarantee order.
