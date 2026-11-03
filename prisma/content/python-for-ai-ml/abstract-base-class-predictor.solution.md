Abstraction exposes **what** an object does and hides **how**.

```python
from abc import ABC, abstractmethod

class BasePredictor(ABC):
    @abstractmethod
    def predict(self, data):
        ...

class ImagePredictor(BasePredictor):
    def predict(self, data):
        return "Image prediction"

print(ImagePredictor().predict(None))
# BasePredictor()  -> TypeError: can't instantiate abstract class
```

Subclasses that skip `predict` cannot be instantiated, so the error appears early rather than at call time.
