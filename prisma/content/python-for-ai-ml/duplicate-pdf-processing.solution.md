Use a **content hash** as identity, plus these safeguards:
- Unique document IDs.
- A database **unique constraint** on the hash.
- **Idempotent** processing (running twice gives the same result).
- A processing **status** column (`pending`, `done`, `failed`).

```python
import hashlib

def file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

seen = set()
for content in (b"pdf-a", b"pdf-b", b"pdf-a"):
    h = file_hash(content)
    if h in seen:
        print("skip duplicate")
        continue
    seen.add(h)
    print("process", h[:8])
```

For large files hash in chunks (`hashlib.sha256()` with `update()`).
