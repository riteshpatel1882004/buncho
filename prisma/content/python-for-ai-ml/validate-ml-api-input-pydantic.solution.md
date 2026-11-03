Use a Pydantic model with constraints.

```python
from pydantic import BaseModel, Field, ValidationError

class PredictionRequest(BaseModel):
    age: int = Field(gt=0)
    income: float = Field(ge=0)
    category: str

request = PredictionRequest(age=25, income=50000, category="A")
print(request)

try:
    PredictionRequest(age=-1, income=10, category="A")
except ValidationError as e:
    print("rejected")
```

Types and constraints are checked **before inference**. In FastAPI, use the model as the request body and invalid input returns a 422 automatically.
