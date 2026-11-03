```python
import numpy as np

a = np.array([1, 2, np.nan, 4])
print(np.isnan(a))        # [False False  True False]
print(np.mean(a))         # nan
print(np.nanmean(a))      # 2.333...
print(a[~np.isnan(a)])    # [1. 2. 4.]
```

Use `np.isnan` for detection (not `== np.nan`, which is always `False`), `np.nan*` functions to ignore NaNs, and `np.nan_to_num` to fill. Calculate imputation values on training data only.
