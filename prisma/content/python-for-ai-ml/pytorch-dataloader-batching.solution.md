A `DataLoader` wraps a `Dataset` and gives **batching, shuffling, parallel loading** and easy iteration.

```python
from torch.utils.data import DataLoader

loader = DataLoader(dataset, batch_size=32, shuffle=True, num_workers=2)
for batch in loader:
    train_step(batch)
```

- `batch_size`: samples per batch.
- `shuffle`: reshuffle every epoch (training only).
- `num_workers`: worker **processes** loading data in parallel, which avoids the GIL.
