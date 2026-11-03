```python
from collections import Counter

def find_duplicates(nums):
    seen, duplicates = set(), set()
    for num in nums:
        if num in seen:
            duplicates.add(num)
        else:
            seen.add(num)
    return list(duplicates)

def frequency(s):
    return Counter(s)

print(find_duplicates([1, 2, 2, 3, 3, 3]))   # [2, 3]
print(frequency("programming").most_common(2))
```

Both are **O(n)** average time and O(n) space.
