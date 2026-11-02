You clean invalid records from a list with this loop, but some bad records survive.

```python
nums = [2, 4, 6, 1]
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)
```

What does it print, why, and what is the safer approach?
