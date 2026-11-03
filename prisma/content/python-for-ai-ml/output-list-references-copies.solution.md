```python
a = [1, 2, 3]; b = a; b.append(4); print(a)                 # A: [1, 2, 3, 4]  same list
a = [1, 2, 3]; b = a[:]; b.append(4); print(a); print(b)    # B: [1, 2, 3] / [1, 2, 3, 4]  shallow copy
a = [[0] * 3] * 3; a[0][0] = 1; print(a)                    # C: [[1, 0, 0], [1, 0, 0], [1, 0, 0]]
a = [1, 2, 3]; print(a is a[:]); print(a == a[:])           # D: False / True
x = [1, 2, 3]; y = x; x = [4, 5, 6]; print(y)               # E: [1, 2, 3]  rebinding x does not change y's object
a = [1, 2, 3]; print(id(a) == id(a))                        # F: True
```

- **A:** assignment makes another name for the same list.
- **B / D:** slicing makes a **shallow copy**: equal (`==`) but not identical (`is`).
- **C:** `[[0]*3]*3` repeats a reference to **one** inner list. Fix: `[[0] * 3 for _ in range(3)]`.
- **E:** rebinding a name does not affect other names pointing to the old object.
