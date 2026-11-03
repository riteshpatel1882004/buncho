```python
def longest_substring(s):
    seen = {}
    left = maximum = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1            # jump past the previous occurrence
        seen[char] = right
        maximum = max(maximum, right - left + 1)
    return maximum

print(longest_substring("abcabcbb"))   # 3
print(longest_substring("bbbbb"))      # 1
```

Sliding window: **O(n)** time, O(min(n, alphabet)) space.
