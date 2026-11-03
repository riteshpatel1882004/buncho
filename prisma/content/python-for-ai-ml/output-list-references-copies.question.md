What is the output of each snippet?

```python
# A
a = [1, 2, 3]; b = a; b.append(4); print(a)

# B
a = [1, 2, 3]; b = a[:]; b.append(4); print(a); print(b)

# C
a = [[0] * 3] * 3; a[0][0] = 1; print(a)

# D
a = [1, 2, 3]; print(a is a[:]); print(a == a[:])

# E
x = [1, 2, 3]; y = x; x = [4, 5, 6]; print(y)

# F
a = [1, 2, 3]; print(id(a) == id(a))
```
