Automatic differentiation computes exact derivatives by applying the **chain rule** to the recorded operations (a computation graph), without symbolic algebra or numerical approximation.

```python
import torch

x = torch.tensor(3.0, requires_grad=True)
y = x ** 2
y.backward()
print(x.grad)   # tensor(6.)   (dy/dx = 2x)
```

Gradients accumulate in `.grad`, so call `optimizer.zero_grad()` each step.
