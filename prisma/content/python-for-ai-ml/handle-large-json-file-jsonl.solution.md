Prefer **JSON Lines (JSONL)**: one JSON object per line, read lazily.

```python
import json

with open("data.jsonl") as file:
    for line in file:
        record = json.loads(line)
        process(record)
```

If the file is already one giant JSON array, use a **streaming parser** such as `ijson`, or convert it to JSONL once. Handle bad lines per record (log and skip) instead of failing the whole job.
