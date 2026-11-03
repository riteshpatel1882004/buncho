```python
from collections import Counter

def intersection(a, b):                      # unique common values
    return list(set(a) & set(b))

def intersection_with_duplicates(a, b):      # keeps multiplicity
    return list((Counter(a) & Counter(b)).elements())

def common_in_all(*lists):
    return set.intersection(*map(set, lists))

print(sorted(intersection([1, 2, 2, 3], [2, 2, 3, 4])))                   # [2, 3]
print(sorted(intersection_with_duplicates([1, 2, 2, 3], [2, 2, 3, 4])))   # [2, 2, 3]
print(common_in_all([1, 2, 3], [2, 3, 4], [3, 2, 9]))                     # {2, 3}
```

Two arrays: **O(n + m)** average. For k lists, roughly O(total elements).
