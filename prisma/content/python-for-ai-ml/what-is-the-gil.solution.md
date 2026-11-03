In standard CPython the GIL lets **only one thread execute Python bytecode at a time** per interpreter.

- **Hurts:** CPU-bound pure-Python code across threads gets no speedup.
- **Does not hurt:** I/O-bound work (threads release the GIL while waiting), and native libraries (NumPy, PyTorch) that release the GIL inside heavy operations.

For CPU-bound Python work, use multiprocessing.
