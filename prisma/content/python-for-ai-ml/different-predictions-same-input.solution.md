- Is the model in **evaluation mode** (`model.eval()`), with **dropout** off?
- Is **preprocessing** identical on every request?
- Are **random seeds** or sampling involved?
- Are **weights changing** (online updates, reloads, different model versions behind a load balancer)?
- Is the **input really identical** (float formatting, ordering)?
- Is there hardware or kernel **nondeterminism** (GPU atomics, mixed precision)?

```python
import torch

model.eval()
with torch.inference_mode():
    out1 = model(x)
    out2 = model(x)
print(torch.allclose(out1, out2))   # should be True
```

For LLMs also check `temperature` and `top_p`.
