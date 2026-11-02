```python
squares_list = [x * x for x in range(1_000_000)]   # all values built in memory
squares_gen  = (x * x for x in range(1_000_000))   # values produced lazily
```

A list comprehension stores every element; a generator produces one at a time, so memory stays roughly constant.

For the 10 GB file, stream it:

```python
def read_records(path):
    with open(path) as f:
        for line in f:
            yield line.strip()

count = sum(1 for _ in read_records("data.txt"))
```

**Caveat:** a generator can be consumed only once and has no `len()` or indexing. Use a list when you need repeated passes or random access.
