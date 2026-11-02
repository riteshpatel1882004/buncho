**LEGB** is the name lookup order: **L**ocal, **E**nclosing function, **G**lobal, **B**uilt-in.

The code prints `10`: `inner` finds its own local `x` first.

```python
count = 0

def update():
    global count      # rebind a module-level name
    count += 1

def outer():
    total = 0
    def add():
        nonlocal total   # rebind a name in the enclosing function
        total += 1
    add()
    return total
```

Without `global` / `nonlocal`, assigning to the name inside a function creates a new local variable.
