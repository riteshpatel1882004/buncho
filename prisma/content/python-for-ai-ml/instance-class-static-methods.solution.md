```python
class MLModel:
    framework = "PyTorch"

    def __init__(self, name):
        self.name = name

    def predict(self, data):             # instance method
        return f"Predicting using {self.name}"

    @classmethod
    def get_framework(cls):              # class method
        return cls.framework

    @staticmethod
    def validate_input(data):            # static method
        return data is not None

m = MLModel("resnet")
print(m.predict([1]), MLModel.get_framework(), MLModel.validate_input([1]))
```

| Method | First argument | Use |
|---|---|---|
| Instance | `self` | Access instance data |
| Class | `cls` | Class-level data, alternative constructors (`from_config`) |
| Static | none | Utility that needs neither |
