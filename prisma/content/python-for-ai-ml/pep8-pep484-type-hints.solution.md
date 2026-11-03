- **PEP 8:** the Python **style guide** (4-space indents, `snake_case` names, line length about 79-88, spacing and import order).
- **PEP 484:** the standard for **type hints**.
- **Type annotations:** hints about expected types, used by editors and type checkers (mypy, pyright).

```python
def scale(values: list[float], factor: float = 1.0) -> list[float]:
    return [v * factor for v in values]

print(scale([1, 2], 2))
print(scale.__annotations__)
```

Python does **not** enforce annotations at runtime; use a checker or a validation library such as Pydantic.
