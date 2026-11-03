**Speed:** the work is I/O waiting, so run calls concurrently with **async** (or a thread pool, depending on the SDK), but also:
- respect **rate limits** and cap concurrency,
- set **timeouts**, add **retries**,
- track each failure independently,
- stay within token and request quotas.

```python
import asyncio

async def call_llm(i, sem):
    async with sem:
        await asyncio.sleep(0.02)          # stands in for a 2 s API call
        return i

async def main():
    sem = asyncio.Semaphore(10)
    results = await asyncio.gather(*(call_llm(i, sem) for i in range(100)),
                                   return_exceptions=True)
    print(len(results))

asyncio.run(main())
```

**Failures: not necessarily.** Use independent error handling, timeouts, retries and **fallbacks**. Degrade gracefully for non-critical dependencies (skip or use cached data). For critical ones, return a clear service error (503) rather than silently returning wrong results.
