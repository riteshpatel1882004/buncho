- `iterrows()` yields `(index, Series)` per row. Slow, and rows are upcast to a common dtype.
- `itertuples()` yields namedtuples. Generally **faster** and preserves dtypes better.

```python
import pandas as pd

df = pd.DataFrame({"a": [1, 2], "b": [0.5, 1.5]})
for row in df.itertuples(index=False):
    print(row.a, row.b)

df["c"] = df["a"] * df["b"]   # vectorized: best choice
```

For numerical transformations, use **vectorized** Pandas/NumPy operations instead of either loop.
