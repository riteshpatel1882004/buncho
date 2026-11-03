| Function | Purpose |
|---|---|
| `json.dump(obj, f)` | Writes JSON to a **file-like object** |
| `json.dumps(obj)` | Returns a JSON **string** |
| `json.load(f)` | Reads JSON from a file |
| `json.loads(s)` | Parses a JSON string |

The trailing **s** stands for *string*.

```python
import json, io

data = {"model": "rf", "acc": 0.95}
s = json.dumps(data)

buf = io.StringIO()
json.dump(data, buf)
buf.seek(0)
print(s == buf.read(), json.load(io.StringIO(s)))
```
