Use async HTTP with a **concurrency limit**, timeouts, retries and rate-limit handling.

```python
import asyncio
import aiohttp

async def call_api(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    urls = ["https://example.com"] * 100
    connector = aiohttp.TCPConnector(limit=10)   # max 10 connections
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [call_api(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    print(len(results))

asyncio.run(main())
```

`gather()` alone does **not** limit concurrency; here the connector does. You can also use `asyncio.Semaphore`. In production add per-request error handling (`return_exceptions=True`), retries with backoff on 429/5xx, and respect the provider's rate limits.
