1. **Encapsulation:** bundle data and the methods that use it, and hide internals. *Example:* a `Model` class that keeps weights private and exposes `fit()` / `predict()`.
2. **Inheritance:** reuse behaviour from a parent class. *Example:* `RandomForestModel(BaseModel)`.
3. **Polymorphism:** different objects share an interface. *Example:* any model can be called with `model.predict(X)`.
4. **Abstraction:** expose what matters, hide how. *Example:* an abstract `BasePredictor` that defines `predict()` without saying how it works.
