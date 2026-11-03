Never load everything at once. Process in **chunks** and keep only **running results**.

```python
import pandas as pd

pd.DataFrame({"x": range(100_000), "y": [1, None] * 50_000}).to_csv("large.csv", index=False)

total, rows = 0, 0
for chunk in pd.read_csv("large.csv", chunksize=50_000):
    chunk = chunk.dropna()
    total += chunk["x"].sum()          # aggregate; do not keep every chunk
    rows += len(chunk)
print(total, rows)
```

**Database, 1 million records**
1. Fetch in **batches** (`fetchmany`) or with a **server-side cursor** so the driver does not load all rows.
2. Select only the **columns** you need.
3. Use **pagination by key** (`WHERE id > last_id ORDER BY id LIMIT n`) instead of large `OFFSET`.
4. Use **bulk operations** (`executemany`, `COPY`) for writes.
5. Watch connections and query performance.
