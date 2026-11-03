- **Syntax error:** the code violates Python's grammar. It is found when the file is parsed, so nothing runs.
- **Exception:** an error that occurs **during execution**, and can be caught.

```python
# print("hi"          -> SyntaxError: '(' was never closed

try:
    print(10 / 0)
except ZeroDivisionError as e:
    print("caught:", e)
```
