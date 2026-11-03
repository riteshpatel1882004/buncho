| Multithreading | Multiprocessing |
|---|---|
| Threads in one process | Separate processes |
| Shared memory | Separate memory |
| Good for I/O-bound work | Good for CPU-bound work |
| Low communication overhead | Higher overhead (pickling data between processes) |
| GIL limits CPU-bound parallelism | Uses multiple cores |
