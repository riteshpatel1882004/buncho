Tokenization converts text into **tokens**: words, sub-words, punctuation or other units.

```python
import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4o")
tokens = encoding.encode("Hello, how are you?")
print(tokens)
print(len(tokens))
```

It matters for **context-window limits**, **prompt budgeting** and **API cost** (billing is per token). Different models use different tokenizers, so always count with the right one.
