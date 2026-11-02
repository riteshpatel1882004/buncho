It prints `[4, 1]`. Removing an item shifts later items left, but the iterator keeps advancing by index, so it **skips** elements (`4` is never checked).

**Fix: build a new list instead of mutating while iterating.**

```python
nums = [2, 4, 6, 1]
nums = [n for n in nums if n % 2 != 0]
print(nums)   # [1]
```

Alternatives: iterate over a copy (`for n in nums[:]`), or use `filter`.
