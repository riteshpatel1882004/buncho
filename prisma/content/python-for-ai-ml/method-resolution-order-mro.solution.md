MRO is the order in which Python searches classes for an attribute or method. It is computed with **C3 linearization**, which keeps parents after children and respects the order of base classes.

```python
class A: pass
class B(A): pass
class C(B): pass

print(C.mro())
# [<class 'C'>, <class 'B'>, <class 'A'>, <class 'object'>]
```

Inspect it with `Class.mro()` or `Class.__mro__`.
