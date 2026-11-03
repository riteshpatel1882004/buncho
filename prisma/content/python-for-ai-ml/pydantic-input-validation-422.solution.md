**Pydantic** validates and parses data using type annotations. FastAPI uses it for request and response validation and for the generated docs.

```python
from pydantic import BaseModel, Field, ValidationError

class PredictionInput(BaseModel):
    features: list[float] = Field(min_length=12, max_length=12)

print(PredictionInput(features=[0.1] * 12).features[:2])

try:
    PredictionInput(features=[0.1] * 10)
except ValidationError as e:
    print("rejected:", e.errors()[0]["type"])
```

**Wrong feature count:** validate **before inference** and return a client error (HTTP **422**). Never silently pad or drop features unless that is explicitly part of the model contract.
