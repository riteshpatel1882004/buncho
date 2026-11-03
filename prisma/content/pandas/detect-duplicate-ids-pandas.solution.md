```python
import pandas as pd

df = pd.DataFrame({"user_id": [1, 2, 2, 3], "v": list("abcd")})

duplicates = df[df.duplicated(subset=["user_id"], keep=False)]
print(duplicates)
```

`keep=False` marks **all** copies as duplicates (not just the later ones). To count: `df["user_id"].value_counts().loc[lambda s: s > 1]`.
