```python
def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks

print(chunk_text("a b c d e f g h", chunk_size=4, overlap=1))
# ['a b c d', 'd e f g', 'g h']
```

`overlap` must be smaller than `chunk_size`, otherwise the loop never advances. Production RAG often uses token-based, sentence-aware or structure-aware chunking.
