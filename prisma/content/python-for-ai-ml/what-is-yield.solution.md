`yield` pauses the function, hands a value to the caller and keeps its local state. The next `next()` resumes right after the `yield`. A function containing `yield` returns a **generator**.

```python
def generate_numbers():
    for i in range(5):
        yield i

for num in generate_numbers():
    print(num)   # 0 1 2 3 4
```

| `yield` | `return` |
|---|---|
| Produces a generator | Returns a final result |
| Preserves function state | Ends the function |
| Lazy, can produce many values | Returns one result |
