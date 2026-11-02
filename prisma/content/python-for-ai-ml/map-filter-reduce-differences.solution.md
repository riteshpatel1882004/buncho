```python
from functools import reduce

nums = [1, 2, 3, 4, 5]
squares = list(map(lambda x: x * x, nums))            # [1, 4, 9, 16, 25]
evens   = list(filter(lambda x: x % 2 == 0, nums))    # [2, 4]
total   = reduce(lambda a, b: a + b, nums)            # 15
```

| Function | Purpose |
|---|---|
| `map` | transform each element |
| `filter` | keep elements that match |
| `reduce` | fold all elements into one value |

`map` and `filter` return lazy **iterators** in Python 3, so wrap them in `list()` if you need a list. `reduce` lives in `functools`.

In practice, comprehensions (`[x*x for x in nums]`) are usually more readable, and `sum(nums)` beats `reduce` for addition.
