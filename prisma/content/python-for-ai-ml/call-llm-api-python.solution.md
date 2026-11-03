```python
from openai import OpenAI

client = OpenAI()   # reads OPENAI_API_KEY from the environment

response = client.responses.create(
    model="gpt-5",   # example model name; use the one you have access to
    input="Explain machine learning in simple terms.",
)
print(response.output_text)
```

**Follow-ups**
- **Failures:** catch specific errors, set timeouts, retry transient ones.
- **Rate limits (429):** exponential backoff with jitter, respect `Retry-After`, add client-side throttling.
- **API keys:** never hardcode; use environment variables or a secrets manager.
- **Token usage:** read `response.usage`, log per request and per user.
- **Retries:** only for transient failures, with a max attempts cap.
