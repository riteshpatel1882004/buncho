- `model.train()`: training behaviour (dropout active, batch norm uses batch statistics and updates running stats).
- `model.eval()`: evaluation behaviour (dropout off, batch norm uses running stats).

**Neither enables or disables gradient tracking.** For inference use both:

```python
model.eval()
with torch.inference_mode():
    output = model(input_data)
```

Forgetting `eval()` gives noisy, inconsistent predictions; forgetting the no-grad context wastes memory.
