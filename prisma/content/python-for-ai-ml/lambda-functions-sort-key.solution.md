A **lambda** is an anonymous, single-expression function.

```python
square = lambda x: x ** 2
print(square(5))   # 25

data = [(1, 5), (2, 3), (3, 8)]
data.sort(key=lambda x: x[1])
print(data)        # [(2, 3), (1, 5), (3, 8)]
```

Best for short throwaway functions such as `key=` arguments. For anything longer, use `def` so it can have a name, docstring and tests.
