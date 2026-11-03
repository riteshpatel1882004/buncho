```python
import os
from dotenv import load_dotenv

load_dotenv()                      # reads a local .env file
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("API key missing")
```

- Keep `.env` out of version control (`.gitignore`).
- Fail fast when a required variable is missing.
- In production, use the platform's secrets manager instead of files.
- Never log keys.
