In this order:
1. **Profile first** and find the real bottleneck.
2. Improve **algorithmic complexity** (better data structure, avoid nested loops).
3. Use **built-ins and vectorization** (NumPy, pandas).
4. Remove **redundant computation**.
5. **Cache** repeated expensive calls.
6. Add **concurrency** only if the workload suits it (threads/async for I/O, processes for CPU).

```python
import cProfile
cProfile.run("sum(i * i for i in range(100_000))")
```

Tools: `cProfile`, `timeit`, `line_profiler`, `tracemalloc`, `memory_profiler`.
