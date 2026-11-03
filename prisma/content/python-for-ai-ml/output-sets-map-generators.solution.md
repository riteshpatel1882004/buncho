```python
a = {1, 2, 3}; b = {3, 4, 5}
print(a | b); print(a & b); print(a - b)     # {1, 2, 3, 4, 5} / {3} / {1, 2}

print(list(map(lambda x: x * 2, [1, 2, 3])))  # [2, 4, 6]

x = [1, 2, 3]
y = (i * 2 for i in x)
print(next(y)); print(next(y))                # 2 / 4
```

- Set ops: union, intersection, difference.
- `map` returns a lazy iterator, so wrap it in `list()` to see the values.
- The generator produces one value per `next()`; nothing is computed ahead of time.
