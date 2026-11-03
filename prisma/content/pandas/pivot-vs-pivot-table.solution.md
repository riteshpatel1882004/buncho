- `pivot()` only **reshapes**; it raises an error if an index/column pair appears more than once.
- `pivot_table()` **aggregates** duplicates (default `mean`).

```python
import pandas as pd

df = pd.DataFrame({
    "day": ["Mon", "Mon", "Tue"],
    "item": ["A", "A", "A"],
    "sales": [1, 3, 5],
})

print(df.pivot_table(index="day", columns="item", values="sales", aggfunc="sum"))
# df.pivot(index="day", columns="item", values="sales")  -> ValueError (duplicate Mon/A)
```
