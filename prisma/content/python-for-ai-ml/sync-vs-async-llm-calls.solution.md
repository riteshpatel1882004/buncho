- **Synchronous:** the call **blocks** the current flow until the response arrives.
- **Asynchronous:** while one call waits, other coroutines run.

For many concurrent requests (for example 100 prompts), async can greatly improve throughput **if the client library supports it** (`AsyncOpenAI`, `httpx`, `aiohttp`). For one call at a time, there is no benefit. Add concurrency limits and retries either way.
