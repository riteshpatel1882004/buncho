1. Request **structured output** using the API's feature (JSON mode / schema).
2. **Parse** safely and catch errors.
3. **Validate** with Pydantic.
4. **Retry** or ask the model to correct itself (with a limit).
5. Never blindly trust model output.

```python
import json

response = '{"name": "Ritesh", "role": "AI Engineer"}'
try:
    data = json.loads(response)
except json.JSONDecodeError:
    print("Invalid JSON")
else:
    print(data["role"])
```
