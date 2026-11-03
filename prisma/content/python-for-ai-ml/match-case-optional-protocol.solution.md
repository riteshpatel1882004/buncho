- **`match-case`** (3.10+): **structural pattern matching**, more than a switch: it can destructure data.
- **`Optional[X]`:** a type that may also be `None` (same as `X | None`).
- **`Protocol`:** a **structural interface**: any class with the right methods matches, with no inheritance required (static duck typing).

```python
from typing import Optional, Protocol

def describe(command):
    match command:
        case ["go", direction]:
            return f"moving {direction}"
        case {"action": "stop"}:
            return "stopping"
        case _:
            return "unknown"

print(describe(["go", "north"]), describe({"action": "stop"}))

def find_user(user_id: int) -> Optional[str]:
    return {1: "Ana"}.get(user_id)

class Predictor(Protocol):
    def predict(self, x: list[float]) -> float: ...

class MyModel:                       # no base class, still a Predictor
    def predict(self, x): return sum(x)

def run(model: Predictor) -> float:
    return model.predict([1.0, 2.0])

print(find_user(2), run(MyModel()))   # None 3.0
```
