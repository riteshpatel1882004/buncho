**pandas, in chunks:**

```python
import pandas as pd

for chunk in pd.read_csv("large_dataset.csv", chunksize=10_000):
    process(chunk)
```

**Standard library, row by row:**

```python
import csv

with open("data.csv", newline="") as f:
    for row in csv.DictReader(f):
        process(row)
```

**Invalid data:** validate per chunk or per record, wrap processing in `try/except`, and write rejected rows to a separate file or log with the error. Do not silently drop them.
