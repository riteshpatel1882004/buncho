An iterator is an object that yields values one at a time through `__iter__()` and `__next__()`.

```python
nums = [10, 20, 30]
it = iter(nums)
print(next(it))   # 10
print(next(it))   # 20
print(next(it))   # 30
# next(it) now raises StopIteration
```

`for` loops call `next()` for you and stop cleanly when `StopIteration` is raised.
