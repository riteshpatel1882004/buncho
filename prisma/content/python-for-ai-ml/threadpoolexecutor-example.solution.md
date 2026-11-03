```python
from concurrent.futures import ThreadPoolExecutor
import requests

urls = [
    "https://example.com",
    "https://python.org",
    "https://github.com",
]

def fetch(url):
    response = requests.get(url, timeout=10)
    return response.status_code

with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(fetch, urls))

print(results)
```

`executor.map` keeps results in input order. Always set a `timeout`, and handle exceptions per request.
