- `*args` collects extra **positional** arguments into a tuple.
- `**kwargs` collects extra **keyword** arguments into a dict.

```python
def train_model(model_name, *datasets, **config):
    print(model_name)   # RandomForest
    print(datasets)     # ('train.csv', 'test.csv')
    print(config)       # {'learning_rate': 0.01, 'epochs': 10}

train_model("RandomForest", "train.csv", "test.csv",
            learning_rate=0.01, epochs=10)
```

They allow flexible configuration and pass-through to another function (`model = Model(**config)`) without listing every parameter. Trade-off: typos in keyword names go unnoticed unless you validate them.
