What is the difference between a view and a copy in NumPy? What does this print?

```python
a = np.array([1, 2, 3, 4])
view = a.view()
copy = a.copy()
view[0] = 100
print(a)
print(copy)
```
