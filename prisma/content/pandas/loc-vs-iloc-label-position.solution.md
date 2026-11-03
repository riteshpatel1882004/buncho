- `loc` is **label-based** (row/column labels, slices include the end).
- `iloc` is **position-based** (integers, slices exclude the end).

```python
import pandas as pd

df = pd.DataFrame({"id": [10, 20], "name": ["Ana", "Raj"]}, index=[5, 6])
print(df.loc[5, "name"])   # Ana: label 5
print(df.iloc[0, 1])       # Ana: row position 0, column position 1
```

With a non-default index the two give different results, so be explicit about which you mean.
