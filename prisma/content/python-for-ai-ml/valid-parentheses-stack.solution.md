```python
def is_valid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return False
        else:
            stack.append(char)
    return not stack

print(is_valid("{[()]}"), is_valid("(]"), is_valid("(("))   # True False False
```

**O(n)** time, O(n) space. The stack holds unclosed opening brackets.
