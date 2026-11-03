- `Series.map(func_or_dict)`: transforms each value of a Series.
- `DataFrame.apply(func, axis=0/1)`: applies a function along an **axis** (column-wise or row-wise).
- `DataFrame.map(func)`: applies a function **element-wise** to the whole DataFrame (Pandas 2.1+). `applymap()` was **deprecated in 2.1** in its favour.

```python
import pandas as pd

df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})
print(df["a"].map(lambda x: x * 10))     # per value in a Series
print(df.apply(sum, axis=0))             # per column: a=3, b=7
print(df.map(lambda x: x + 1))           # per element
```

All three run Python-level loops. Prefer vectorized operations (`df["a"] * 10`) when possible.
