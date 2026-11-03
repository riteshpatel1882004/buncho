Python tracks how many references point to each object. When the count reaches zero, CPython can free the object.

```python
import sys

a = []
print(sys.getrefcount(a))   # 2: 'a' plus the temporary argument
b = a
print(sys.getrefcount(a))   # 3
```

`getrefcount()` adds a temporary reference because the object is passed to the function.
