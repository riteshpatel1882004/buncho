- **Inheritance:** *is-a* relationship.
- **Composition:** *has-a* relationship. An object holds other objects and delegates to them.

```python
class Preprocessor:
    def transform(self, data):
        return data

class Predictor:
    def predict(self, data):
        return "Prediction"

class MLService:
    def __init__(self):
        self.preprocessor = Preprocessor()
        self.predictor = Predictor()

    def run(self, data):
        data = self.preprocessor.transform(data)
        return self.predictor.predict(data)

print(MLService().run([1, 2]))
```

Composition is more flexible: you can swap a part (for example a different predictor) without touching a class hierarchy.
