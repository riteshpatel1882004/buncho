A child class provides its own version of a method defined in the parent. Python calls the child's version.

```python
class Model:
    def predict(self):
        print("Base prediction")

class CNN(Model):
    def predict(self):
        print("CNN prediction")

CNN().predict()   # CNN prediction
```

Call `super().predict()` inside the override if you also want the parent's behaviour.
