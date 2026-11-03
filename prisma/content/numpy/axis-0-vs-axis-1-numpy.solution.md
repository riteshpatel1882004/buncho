The `axis` is the dimension that gets **collapsed**.

```python
import numpy as np

a = np.array([[1, 2, 3],
              [4, 5, 6]])
print(np.sum(a, axis=0))   # [5 7 9]  down the rows: one result per column
print(np.sum(a, axis=1))   # [ 6 15]  across the columns: one result per row
```

Remember: result shape is the original shape with that axis removed.
