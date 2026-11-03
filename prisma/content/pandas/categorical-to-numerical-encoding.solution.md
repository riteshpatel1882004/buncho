```python
import pandas as pd

df = pd.DataFrame({"department": ["HR", "IT", "HR"]})
print(pd.get_dummies(df, columns=["department"], dtype=int))
```

- **One-hot** (`get_dummies` or scikit-learn `OneHotEncoder`): for nominal categories.
- **Ordinal** (`OrdinalEncoder`): when there is a real order (low < medium < high).
- For production, use scikit-learn encoders inside a `Pipeline` with `handle_unknown="ignore"` so unseen categories at inference do not break, and the columns stay consistent between train and test.
