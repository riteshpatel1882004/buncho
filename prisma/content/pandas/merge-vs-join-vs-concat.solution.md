| Method | Purpose |
|---|---|
| `merge()` | Database-style join on columns (or indexes) with `how=inner/left/right/outer` |
| `join()` | Index-based join (convenience wrapper around `merge`) |
| `concat()` | Stacks frames along an axis (rows or columns) |

```python
import pandas as pd

users = pd.DataFrame({"id": [1, 2], "name": ["Ana", "Raj"]})
orders = pd.DataFrame({"id": [1, 1, 2], "amt": [5, 7, 9]})

print(users.merge(orders, on="id", how="left"))
print(pd.concat([users, users], axis=0, ignore_index=True))
```
