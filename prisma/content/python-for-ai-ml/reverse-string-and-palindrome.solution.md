```python
def reverse_string(s):
    return "".join(reversed(s))          # O(n)

def reverse_naive(s):
    result = ""
    for char in s:
        result = char + result           # O(n²): a new string each time
    return result

def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True                          # O(n) time, O(1) space

print(reverse_string("python"), is_palindrome("level"), is_palindrome("abc"))
```

For real text, normalize first (lowercase, strip spaces and punctuation).
