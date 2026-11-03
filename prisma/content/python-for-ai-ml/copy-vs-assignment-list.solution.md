```python
a = [1, 2, 3]
b = a            # another reference to the same list
c = a.copy()     # new (shallow) copy
a.append(4)
print(b)   # [1, 2, 3, 4]
print(c)   # [1, 2, 3]
```

Assignment never copies. `copy()` makes a **shallow** copy, so nested objects are still shared. Use `copy.deepcopy` for nested data.
