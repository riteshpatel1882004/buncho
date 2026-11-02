Convert to sets and intersect: O(n + m) on average.

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a & b)                 # {3, 4}
print(a.intersection(b))     # {3, 4}
```

Nested loops or `in` checks on lists are O(n × m).

**If memory is tight:** build a set from the smaller dataset only and stream the larger one against it, or use a database join / `pandas.merge` / `Series.isin`.
