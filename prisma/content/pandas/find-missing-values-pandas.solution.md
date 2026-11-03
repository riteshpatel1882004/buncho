```python
import pandas as pd, numpy as np

df = pd.DataFrame({"age": [25, np.nan, 31], "city": ["A", None, "C"]})
print(df.isnull().sum())          # missing count per column
print(df.isnull().mean())         # fraction missing per column
print(df[df.isnull().any(axis=1)])  # rows with any missing value
```

`isnull()` and `isna()` are the same.
