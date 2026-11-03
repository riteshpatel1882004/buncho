```python
import pandas as pd

df = pd.DataFrame({"id": [1, 1, 2], "v": ["a", "a", "b"]})

print(df.drop_duplicates())                           # full-row duplicates
print(df.drop_duplicates(subset=["id"], keep="last"))  # by column(s)
```

`keep` can be `"first"` (default), `"last"` or `False` (drop all copies). Prefer returning a new frame over `inplace=True`.
