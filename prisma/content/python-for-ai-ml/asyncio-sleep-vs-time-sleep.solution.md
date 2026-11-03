- `time.sleep()` **blocks the whole thread**.
- `await asyncio.sleep()` **suspends only the current coroutine** and lets others run.

Calling `time.sleep()` (or any blocking call, such as `requests.get`) inside an async function **freezes the event loop**, so all other tasks stall. Use async libraries, or `await asyncio.to_thread(blocking_func)`.
