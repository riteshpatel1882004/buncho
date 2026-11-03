```python
class NumberIterator:
    def __init__(self, limit):
        self.limit = limit
        self.current = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.current >= self.limit:
            raise StopIteration
        self.current += 1
        return self.current

for num in NumberIterator(5):
    print(num)   # 1 2 3 4 5
```

`__iter__` returns `self`; `__next__` returns the next value and raises `StopIteration` when done. A generator function does the same in fewer lines.
