Default arguments are evaluated **once**, when the function is defined. The same list is reused by every call that omits `results`.

```python
def add_result(result, results=None):
    if results is None:
        results = []
    results.append(result)
    return results

print(add_result(1))   # [1]
print(add_result(2))   # [2]
```

Never use a mutable object (`list`, `dict`, `set`) as a default value.
