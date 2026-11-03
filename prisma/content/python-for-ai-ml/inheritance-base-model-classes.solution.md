Define a common base class with the shared interface and let each model implement the specifics.

```python
class BaseModel:
    def train(self, X, y):
        raise NotImplementedError

    def predict(self, X):
        raise NotImplementedError

class LinearModel(BaseModel):
    def train(self, X, y):
        print("Training linear model")

    def predict(self, X):
        return [1, 2, 3]

model = LinearModel()
model.train([[0]], [0])
print(model.predict([[0]]))
```

Callers only depend on `BaseModel`, so models are interchangeable. To force subclasses to implement the methods, use `abc.ABC`.
