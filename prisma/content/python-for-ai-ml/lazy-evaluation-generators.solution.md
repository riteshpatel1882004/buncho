Lazy evaluation delays computation until the result is needed.

```python
numbers = (x * x for x in range(1_000_000))
print(next(numbers))   # 0: only one value computed
```

Generators, `map`, `filter`, `zip` and `range` are lazy. It keeps memory low and lets you stop early.
