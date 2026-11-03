```python
class Base: pass
class Child(Base): pass

c = Child()
print(type(c))                       # <class '__main__.Child'>
print(isinstance(c, Base))           # True: checks type or inheritance
print(issubclass(Child, Base))       # True: checks class inheritance

Dynamic = type("Dynamic", (Base,), {"x": 1})   # type() can create a class
print(Dynamic().x)

class Meta(type):                    # metaclass: a class whose instances are classes
    def __new__(mcs, name, bases, ns):
        ns["registered"] = True
        return super().__new__(mcs, name, bases, ns)

class Plugin(metaclass=Meta): pass
print(Plugin.registered)             # True
```

Prefer `isinstance` over `type(x) == ...` because it respects inheritance. Metaclasses are rarely needed; class decorators or `__init_subclass__` are usually simpler.
