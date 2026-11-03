`@dataclass` auto-generates `__init__`, `__repr__` and `__eq__` from the annotated fields.

```python
from dataclasses import dataclass

@dataclass
class ModelConfig:
    learning_rate: float
    epochs: int
    batch_size: int

config = ModelConfig(0.001, 20, 32)
print(config)   # ModelConfig(learning_rate=0.001, epochs=20, batch_size=32)
```

Good for configs, experiment metadata and structured records. It does **not** validate types at runtime; use Pydantic for that. For mutable defaults, use `field(default_factory=list)`.
