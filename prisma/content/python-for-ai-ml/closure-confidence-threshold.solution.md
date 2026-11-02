A **closure** is an inner function that remembers variables from its enclosing scope even after the outer function has returned.

```python
def make_classifier(threshold):
    def classify(score):
        return "positive" if score >= threshold else "negative"
    return classify

strict = make_classifier(0.9)
lenient = make_classifier(0.5)

print(strict(0.7))    # negative
print(lenient(0.7))   # positive
```

`functools.partial` or a small class are alternatives; a closure is the lightest option.
