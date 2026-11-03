**Investigate**
1. Is the whole dataset loaded at once?
2. Are large intermediate arrays duplicated?
3. Is the batch size too large?
4. Is GPU memory exhausted?
5. Are references to old predictions or tensors kept (for example appending a loss tensor with its graph)?
6. Can data loading be streamed?
7. Can dtypes be reduced?

**Fix**
- Generators or chunked processing.
- Smaller batches, gradient accumulation.
- `float32` (or lower) instead of `float64` where precision allows.
- Avoid unnecessary copies; release references (`del`, `.item()`, `.detach()`).
- **Profile first** to find the real bottleneck.
