```python
def move_zeroes(nums):
    position = 0
    for num in nums:
        if num != 0:
            nums[position] = num
            position += 1
    while position < len(nums):
        nums[position] = 0
        position += 1
    return nums

def missing_number(nums):
    n = len(nums)
    return n * (n + 1) // 2 - sum(nums)

print(move_zeroes([0, 1, 0, 3, 12]))    # [1, 3, 12, 0, 0]
print(missing_number([3, 0, 1]))        # 2
```

Both **O(n)** time, O(1) extra space. (XOR of all indices and values is an alternative for the missing number.)
