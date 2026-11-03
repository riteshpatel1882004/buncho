- Load only needed columns: `usecols=[...]`.
- Set compact dtypes: `dtype={"id": "int32", "score": "float32"}`.
- Read in **chunks** (`chunksize=`) if it still does not fit.
- Convert low-cardinality strings to **`category`**.
- Prefer **vectorized** operations; avoid `iterrows()` and row-wise `apply`.
- Avoid unnecessary copies.
- Store data as **Parquet** instead of CSV.
- If Pandas is still the limit, consider **Polars**, **DuckDB** or distributed tools (Dask, Spark).

```python
import pandas as pd

df = pd.read_csv("big.csv", usecols=["city", "score"],
                 dtype={"city": "category", "score": "float32"})
print(df.memory_usage(deep=True).sum())
```
