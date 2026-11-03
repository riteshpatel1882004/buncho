- **Serialization:** Python object to JSON text (`json.dumps`, `json.dump` for files).
- **Deserialization:** JSON text to Python object (`json.loads`, `json.load` for files).

```python
import json

data = {"model": "RandomForest", "accuracy": 0.95}

json_data = json.dumps(data)         # '{"model": "RandomForest", "accuracy": 0.95}'
python_data = json.loads(json_data)  # back to a dict
print(json_data, python_data)
```

JSON handles basic types only. NumPy arrays, datetimes and custom classes need conversion (for example `.tolist()`) or a custom `default=` function. For LLM output, validate the parsed result (for example with Pydantic).
