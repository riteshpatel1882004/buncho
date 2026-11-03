```python
def merge_sorted(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out

def merge_intervals(intervals):
    intervals = sorted(intervals, key=lambda x: x[0])
    result = []
    for start, end in intervals:
        if not result or start > result[-1][1]:
            result.append([start, end])
        else:
            result[-1][1] = max(result[-1][1], end)
    return result

print(merge_sorted([1, 3, 5], [2, 4, 6]))               # [1, 2, 3, 4, 5, 6]
print(merge_intervals([[1, 3], [2, 6], [8, 10]]))       # [[1, 6], [8, 10]]
```

Sorted merge: **O(n + m)**. Intervals: **O(n log n)** because of the sort.
