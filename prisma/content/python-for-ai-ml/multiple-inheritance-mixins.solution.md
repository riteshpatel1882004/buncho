A class inherits from more than one parent. Python resolves name clashes using the MRO.

```python
class Logger:
    def log(self):
        print("Logging")

class Validator:
    def validate(self):
        print("Validating")

class MLService(Logger, Validator):
    pass

service = MLService()
service.log()
service.validate()
```

Small single-purpose parents (mixins) work well. Avoid deep or overlapping hierarchies; prefer composition when unsure.
