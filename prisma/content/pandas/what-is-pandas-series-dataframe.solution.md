Pandas is a Python library for data manipulation and analysis, built on NumPy.

- **Series:** one-dimensional labeled array.
- **DataFrame:** two-dimensional labeled table; each column is a Series.

```python
import pandas as pd

s = pd.Series([1, 2, 3], index=["a", "b", "c"])
df = pd.DataFrame({"name": ["Ana", "Raj"], "age": [25, 30]})
print(type(df["age"]))   # <class 'pandas.core.series.Series'>
```
