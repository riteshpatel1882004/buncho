```python
import joblib
from sklearn.linear_model import LogisticRegression

model = LogisticRegression().fit([[0], [1], [2], [3]], [0, 0, 1, 1])

joblib.dump(model, "model.pkl")
loaded_model = joblib.load("model.pkl")
print(loaded_model.predict([[0], [3]]))
```

**Risk:** pickle and joblib files can **execute arbitrary code when loaded**. Never load them from untrusted sources. Use trusted artifacts, check integrity (hash or signature), and prefer safer formats such as `safetensors` or ONNX where possible. Also pin library versions, since pickles can break across versions.
