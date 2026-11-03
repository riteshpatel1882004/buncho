```python
x = 10
def test():
    x = 20
test()
print(x)        # A: 10

x = [1, 2, 3]
def test(a):
    a += [4]
test(x)
print(x)        # B: [1, 2, 3, 4]
```

- **A:** `x = 20` creates a **local** variable; the global `x` is untouched (use `global x` to change it).
- **B:** for lists, `+=` calls `__iadd__` and **mutates in place**, so the caller sees the change. (`a = a + [4]` would rebind and not affect the caller.)
