A prediction service stores results with this function. Users report that results from earlier requests appear in later responses.

```python
def add_result(result, results=[]):
    results.append(result)
    return results

print(add_result(1))   # [1]
print(add_result(2))   # [1, 2]
```

Why does this happen and how do you fix it?
