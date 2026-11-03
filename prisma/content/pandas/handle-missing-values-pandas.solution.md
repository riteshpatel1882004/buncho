```python
import pandas as pd, numpy as np

df = pd.DataFrame({"age": [25, np.nan, 31], "city": ["A", None, "C"]})

dropped = df.dropna()                                  # remove rows with NaN
df["age"] = df["age"].fillna(df["age"].median())       # numeric: median
df["city"] = df["city"].fillna("Unknown")              # categorical
print(df)
```

**Choice depends on why the data is missing and the modeling goal:** drop if few rows and missing at random; median for skewed numerics; a constant or "Unknown" for categories; add a `was_missing` flag if missingness is informative. Compute fill values on **training data only** to avoid leakage.
