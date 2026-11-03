`groupby` implements **split-apply-combine**: split rows into groups, apply a function to each, combine the results.

```python
import pandas as pd

df = pd.DataFrame({"department": ["HR", "IT", "IT"], "salary": [50, 70, 90]})

print(df.groupby("department")["salary"].mean())
print(df.groupby("department")["salary"].agg(["mean", "max", "count"]))
```

Use `transform` to get a group statistic aligned to the original rows (for example a per-group mean feature).
