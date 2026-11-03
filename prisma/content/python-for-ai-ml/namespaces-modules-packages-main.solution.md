- **Namespace:** a mapping from names to objects (local, global, built-in scopes, module attributes).
- **Module:** a Python file containing definitions.
- **Package:** a directory of related modules (usually with `__init__.py`).
- **`__name__`:** the module's name in its execution context.
- **`__main__`:** the name given to the top-level script being run.
- **`sys.modules`:** the cache of already-imported modules; a second `import` reuses it.

```python
import sys, math

print(__name__)                     # __main__ when run directly
print("math" in sys.modules)        # True: cached after import

if __name__ == "__main__":
    print("runs only when executed directly, not when imported")
```

The `__main__` guard also matters for multiprocessing on Windows/macOS.
