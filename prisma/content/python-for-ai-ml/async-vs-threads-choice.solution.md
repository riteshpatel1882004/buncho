- **Async:** many concurrent I/O operations (hundreds of API calls) and the libraries support async (`aiohttp`, `httpx`, async DB drivers). Lower overhead per task than a thread.
- **Threads:** blocking I/O libraries, or when async support is unavailable.

Neither helps CPU-bound pure-Python work; use multiprocessing for that.
