```python
from collections import Counter

def first_unique(s):
    count = Counter(s)
    for char in s:
        if count[char] == 1:
            return char
    return None

def is_anagram(s1, s2):
    return Counter(s1) == Counter(s2)

print(first_unique("swiss"), is_anagram("listen", "silent"))   # w True
```

Both **O(n)** average. For anagrams, `sorted(s1) == sorted(s2)` is simpler but O(n log n). Normalize case and spaces if needed.
