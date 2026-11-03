**Duck typing:** behaviour matters more than declared type. If an object has the needed methods, it works.

```python
class Dog:
    def speak(self): return "woof"

class Robot:
    def speak(self): return "beep"

for thing in (Dog(), Robot()):
    print(thing.speak())          # no common base class needed
```

**Monkey patching:** changing a class or object **at runtime**.

```python
class Client:
    def call(self): return "real API"

Client.call = lambda self: "fake response"     # patched
print(Client().call())
```

Acceptable in **tests** (prefer `unittest.mock.patch`, which restores the original). Avoid it in production code because it is hard to trace.
