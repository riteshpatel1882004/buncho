Neither. Python uses **call by object reference** (object sharing): the parameter is a new name bound to the *same object*.

- **Mutating** the object (`append`, item assignment) is visible to the caller.
- **Rebinding** the parameter (`data = ...`) is not.

```python
def mutate(data):
    data.append(4)

def rebind(data):
    data = [10, 20]

x = [1, 2, 3]
mutate(x);  print(x)   # [1, 2, 3, 4]
rebind(x);  print(x)   # [1, 2, 3, 4]  unchanged by rebind
```
