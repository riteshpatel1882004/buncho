```python
import tracemalloc

tracemalloc.start()
data = [i for i in range(100_000)]
current, peak = tracemalloc.get_traced_memory()
print("Current:", current)
print("Peak:", peak)
tracemalloc.stop()
```

Other tools: `tracemalloc.take_snapshot()` to find the top allocating lines, `memory_profiler` for line-by-line usage, `psutil` for process RSS, and `torch.cuda.memory_allocated()` for GPU.
