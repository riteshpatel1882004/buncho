```python
from multiprocessing import Pool

def square(n):
    return n * n

if __name__ == "__main__":
    with Pool(processes=4) as pool:
        results = pool.map(square, range(10))
    print(results)   # [0, 1, 4, 9, ..., 81]
```

With the `spawn` start method (Windows, macOS), child processes **re-import the module**. Without the guard they would start new pools recursively. The function must be defined at module level so it can be pickled.
