Outliers are values below `Q1 - 1.5*IQR` or above `Q3 + 1.5*IQR`.

```python
import pandas as pd

df = pd.DataFrame({"salary": [50, 52, 55, 58, 60, 400]})

Q1 = df["salary"].quantile(0.25)
Q3 = df["salary"].quantile(0.75)
IQR = Q3 - Q1
lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR

outliers = df[(df["salary"] < lower) | (df["salary"] > upper)]
print(outliers)
```

Decide whether to remove, cap (winsorize) or keep them; an outlier may be a real, important case.
