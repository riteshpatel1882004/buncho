No. Defining a method twice just replaces the first definition. Alternatives:

```python
from functools import singledispatch

def add(a, b=0, c=0):          # default arguments
    return a + b + c

print(add(2, 3))      # 5
print(add(2, 3, 4))   # 9

@singledispatch                # dispatch on the type of the first argument
def describe(x):
    return "something"

@describe.register(int)
def _(x):
    return "an int"

print(describe(5), describe("a"))   # an int something
```

Also: `*args` / `**kwargs`, or `typing.overload` for type-checker-only signatures.
