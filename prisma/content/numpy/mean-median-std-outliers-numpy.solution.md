- **Mean:** arithmetic average.
- **Median:** middle value after sorting.
- **Std:** spread of values around the mean.

```python
import numpy as np

x = np.array([10, 11, 12, 13, 1000])
print(np.mean(x))     # 209.2  pulled up by the outlier
print(np.median(x))   # 12.0   robust
print(np.std(x))
```

The **median** is more robust to outliers. For spread, consider the IQR or MAD.
