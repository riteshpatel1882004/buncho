Tuples are immutable with a fixed size, so they do not need the spare capacity lists allocate for `append`.

```python
import sys
print(sys.getsizeof([1, 2, 3]))   # larger
print(sys.getsizeof((1, 2, 3)))   # smaller
```

**Choose a tuple** for fixed records, dictionary keys (if all items are hashable), and values that must not change, such as `(height, width)` or `(user_id, item_id)`.

Do not oversell speed: creation and iteration are slightly faster, but the real difference depends on the workload. Pick by semantics first.
