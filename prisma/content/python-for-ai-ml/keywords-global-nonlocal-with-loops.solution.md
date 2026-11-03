- **`global`:** refers to a **module-level** name so a function can rebind it.
- **`nonlocal`:** rebinds a variable in an **enclosing function** scope.
- **`with`:** the **context manager** protocol (setup and guaranteed cleanup).
- **`pass`:** an empty statement (a placeholder).
- **`break`:** terminates the loop.
- **`continue`:** skips to the next iteration.

```python
count = 0
def inc():
    global count
    count += 1

def counter():
    total = 0
    def add():
        nonlocal total
        total += 1
        return total
    return add

inc(); add = counter(); add()
print(count, add())          # 1 2

for n in range(6):
    if n == 1:
        continue             # skip 1
    if n == 4:
        break                # stop at 4
    print(n, end=" ")        # 0 2 3
print()

def todo():
    pass                     # placeholder body

with open("demo.txt", "w") as f:
    f.write("closed automatically")
```
