```python
arr = [10, 20, 30, 40]

del arr[0]         # by index, returns nothing        -> [20, 30, 40]
arr.remove(30)     # by value, first match only       -> [20, 40]
last = arr.pop()   # by index (default last), returns -> 40
```

| Method | Selects by | Returns |
|---|---|---|
| `del arr[i]` | index (or slice) | nothing |
| `arr.remove(v)` | value (first match; `ValueError` if missing) | `None` |
| `arr.pop(i)` | index (default last) | the removed item |

Remove by index and keep the value: `arr.pop(index)`. Removing from the front or middle is O(n).
