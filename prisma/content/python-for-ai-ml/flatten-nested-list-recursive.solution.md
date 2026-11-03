```python
def flatten(data):
    result = []
    for item in data:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

print(flatten([1, [2, [3, 4]], 5]))   # [1, 2, 3, 4, 5]
```

**O(n)** in the number of elements. Very deep nesting can hit the recursion limit; use an explicit stack or a generator with `yield from` for that case.
