NumPy is Python's core library for numerical computing. Its main object is the **`ndarray`**: a multidimensional, **homogeneous** array stored in contiguous memory, with fast vectorized operations.

```python
import numpy as np
a = np.array([[1, 2], [3, 4]])
print(type(a), a.dtype)
```

Most ML libraries (pandas, scikit-learn, PyTorch interop) build on it.
