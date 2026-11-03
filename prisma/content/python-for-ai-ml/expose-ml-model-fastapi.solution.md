```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI()
model = joblib.load("model.pkl")      # load once at startup, not per request

class PredictionInput(BaseModel):
    features: list[float]

@app.post("/predict")
def predict(data: PredictionInput):
    prediction = model.predict([data.features])
    return {"prediction": prediction.tolist()}
```

Run with `uvicorn main:app`. Pydantic rejects bad input with a 422. Convert NumPy results with `.tolist()`. A plain `def` endpoint runs in a thread pool, which suits blocking model calls; use batching, health checks and logging for production.
