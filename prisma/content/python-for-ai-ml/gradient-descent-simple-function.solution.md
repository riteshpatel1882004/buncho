The gradient is `f'(x) = 2x`. Update: `x ← x − lr · 2x`.

```python
def gradient_descent(x, lr=0.1, epochs=100):
    for _ in range(epochs):
        gradient = 2 * x
        x = x - lr * gradient
    return x

print(gradient_descent(10))            # close to 0
print(gradient_descent(10, lr=1.1, epochs=10))   # diverges
```

With `lr > 1` each step overshoots by more than it corrects, so `x` grows instead of shrinking.
