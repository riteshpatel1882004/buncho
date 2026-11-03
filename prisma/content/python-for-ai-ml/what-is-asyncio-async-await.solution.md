Async code lets a program do other work while waiting for I/O, on a **single thread** with an event loop.

```python
import asyncio

async def fetch_data():
    print("Fetching...")
    await asyncio.sleep(2)
    print("Completed")

asyncio.run(fetch_data())
```

- `async def` defines a coroutine.
- `await` pauses it until the awaited operation finishes, letting other coroutines run.
- `asyncio.run()` starts the event loop.
