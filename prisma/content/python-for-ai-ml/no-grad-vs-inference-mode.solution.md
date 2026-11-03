Both stop gradient recording.

- `no_grad()`: disables gradient tracking; tensors can later be used in autograd normally.
- `inference_mode()`: also skips extra autograd bookkeeping (version counters, view tracking), so it can be **faster**, but tensors created inside are **inference tensors** with stricter restrictions (they cannot be used in autograd later).

Use `inference_mode()` for pure inference; `no_grad()` when the outputs may feed into training code.
