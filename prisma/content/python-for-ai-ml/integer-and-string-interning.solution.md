**Interning** means CPython reuses some immutable objects (for example small integers from -5 to 256 and many identifier-like strings) instead of creating new ones, to save memory.

```python
a, b = int("256"), int("256")
print(a is b)   # True: cached small int

c, d = int("257"), int("257")
print(c is d)   # False: two separate objects
print(c == d)   # True
```

Interning is a CPython implementation detail and can differ between versions and contexts. `is` tests identity, not value, so use `==` for values.
