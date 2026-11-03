```python
def second_largest(nums):
    first = second = float("-inf")
    for num in nums:
        if num > first:
            first, second = num, first
        elif first > num > second:
            second = num
    return None if second == float("-inf") else second

def majority_element(nums):              # Boyer-Moore voting
    candidate, count = None, 0
    for num in nums:
        if count == 0:
            candidate = num
        count += 1 if num == candidate else -1
    return candidate                      # valid if a majority is guaranteed

print(second_largest([3, 1, 4, 4, 2]))        # 3
print(majority_element([2, 2, 1, 1, 2, 2, 3]))  # 2
```

Both are **O(n) time, O(1) space**. If a majority is not guaranteed, verify the candidate with a second count.
