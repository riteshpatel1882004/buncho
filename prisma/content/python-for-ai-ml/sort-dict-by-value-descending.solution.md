```python
scores = {"A": 90, "B": 70, "C": 95}

result = dict(sorted(scores.items(), key=lambda kv: kv[1], reverse=True))
print(result)   # {'C': 95, 'A': 90, 'B': 70}
```

`sorted` returns a list of `(key, value)` pairs; `dict(...)` rebuilds it, keeping that order (Python 3.7+). For just the top k, use `heapq.nlargest(k, scores.items(), key=lambda kv: kv[1])`.
