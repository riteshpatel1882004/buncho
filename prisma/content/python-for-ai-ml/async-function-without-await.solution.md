Nothing prints. Calling an `async def` function returns a **coroutine object**; the body has not run.

```python
import asyncio

async def hello():
    print("Hello")

result = hello()
print(type(result))      # <class 'coroutine'>
asyncio.run(result)      # now it runs: Hello
```

You must `await` it or schedule it (`asyncio.run`, `asyncio.create_task`). Forgetting `await` gives the warning "coroutine ... was never awaited".
