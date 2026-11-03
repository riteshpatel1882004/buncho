```python
try:
    result = 10 / 2
except ZeroDivisionError:
    print("Cannot divide by zero")
else:
    print("Execution successful")
finally:
    print("Cleanup completed")
```

Output: `Execution successful`, then `Cleanup completed`.

- `try`: code that may fail.
- `except`: runs if a matching exception is raised.
- `else`: runs only if **no** exception occurred.
- `finally`: always runs (cleanup).

Catch specific exceptions; a bare `except:` hides bugs.
