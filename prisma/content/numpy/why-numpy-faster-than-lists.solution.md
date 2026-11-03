- Arrays are **homogeneous** and stored in **contiguous memory**.
- Operations run in optimized **C** code, without per-element interpreter overhead.
- Optimized numerical libraries (BLAS) can be used for linear algebra.

**Not always faster:** small arrays, or code that keeps converting between lists and arrays, may not benefit. A Python loop over NumPy elements is often *slower* than a list.
