A dict finds a key's slot from its hash. If the hash could change after insertion, the key would be lost. So keys need a **stable hash** and `==` must agree with it.

```python
d = {"name": "Ritesh", 10: "Python", (1, 2): "pair"}   # str, int, tuple are fine
# d[[1, 2]] = "x"   # TypeError: unhashable type: 'list'
```

- **List, dict, set:** mutable, so unhashable.
- **Tuple:** hashable only if all its items are hashable. `([1], 2)` is not.
