- **Iterable:** can be looped over (has `__iter__`), such as a list, tuple, string or dict.
- **Iterator:** produces values one at a time (has `__next__`) and remembers its position.

```python
nums = [1, 2, 3]
print(iter(nums))              # <list_iterator ...>
print(hasattr(nums, "__next__"))   # False: a list is iterable, not an iterator
```

`iter(iterable)` returns an iterator. An iterator is also iterable (its `__iter__` returns itself), but is **exhausted after one pass**.
