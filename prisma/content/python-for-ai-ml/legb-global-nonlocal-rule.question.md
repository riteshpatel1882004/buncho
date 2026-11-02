Explain Python's LEGB rule.

What does this print? Then, how would you modify a global variable from inside a function, and a variable of an enclosing function?

```python
x = 100

def outer():
    x = 50
    def inner():
        x = 10
        print(x)
    inner()

outer()
```
