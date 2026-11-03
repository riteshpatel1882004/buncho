`yield from` delegates iteration to another iterable or generator.

```python
def first():
    yield 1
    yield 2

def second():
    yield from first()
    yield 3

print(list(second()))   # [1, 2, 3]
```

For documents:

```python
def read_docs(sources):
    for read in sources:
        yield from read()   # each source streams through lazily
```

Output is produced one item at a time, so no intermediate lists are created.
