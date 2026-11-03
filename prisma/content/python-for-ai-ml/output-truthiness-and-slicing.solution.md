```python
print(bool([]), bool({}), bool(""), bool(0), bool(None))   # False False False False False
print([1, 2, 3] * 2)                                       # [1, 2, 3, 1, 2, 3]
a = [1, 2, 3]
print(a[-1], a[-2])                                        # 3 2
print(a[-4:])                                              # [1, 2, 3]
```

- Empty containers, `""`, `0` and `None` are **falsy**.
- `list * 2` **repeats** the list; it does not multiply elements.
- Negative indexes count from the end.
- An out-of-range **slice** is clipped and never raises `IndexError` (a single out-of-range index does).
