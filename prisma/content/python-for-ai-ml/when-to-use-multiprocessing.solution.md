Use it for **CPU-bound** work:

- Heavy image transformations.
- Numerical processing written in pure Python.
- Independent computation jobs.
- CPU-bound preprocessing that is not already in native code.

**GPU training:** not automatically. Use the framework's tools (for example PyTorch `DataLoader` workers, `DistributedDataParallel`). Beware of CUDA with `fork`; use the `spawn` start method.
