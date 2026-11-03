```python
def longest_consecutive(nums):
    nums_set = set(nums)
    longest = 0
    for num in nums_set:
        if num - 1 not in nums_set:          # start of a sequence
            current, count = num, 1
            while current + 1 in nums_set:
                current += 1
                count += 1
            longest = max(longest, count)
    return longest

print(longest_consecutive([100, 4, 200, 1, 3, 2]))   # 4  (1,2,3,4)
```

Each number is visited at most twice, so it is **O(n)** average. Sorting would be O(n log n).
