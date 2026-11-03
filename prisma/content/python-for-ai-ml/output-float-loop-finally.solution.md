```python
print(0.1 + 0.2 == 0.3)        # A: False

for i in range(3):
    pass
print(i)                       # B: 2

def test():
    try:
        return 10
    finally:
        print("Finally executed")
print(test())                  # C: Finally executed, then 10
```

- **A:** floats cannot represent most decimals exactly. Use `math.isclose(0.1 + 0.2, 0.3)` (True).
- **B:** a `for` loop does not create its own scope; `i` stays defined with its last value.
- **C:** `finally` runs **before** the function actually returns, so it prints first.
