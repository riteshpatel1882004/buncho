A **shallow copy** creates a new outer object but reuses the nested objects. A **deep copy** copies the nested objects too.

```python
import copy

base = {"model": "rf", "params": {"lr": 0.1, "depth": 5}}

shallow = copy.copy(base)
deep = copy.deepcopy(base)

base["params"]["lr"] = 0.5
print(shallow["params"]["lr"])   # 0.5  (shared inner dict)
print(deep["params"]["lr"])      # 0.1  (independent)
```

Use `copy.deepcopy(base)` for each experiment, then modify the copy.
