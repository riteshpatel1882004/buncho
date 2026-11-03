**Pipeline**
1. Read PDFs (PyMuPDF or pypdf).
2. Extract text.
3. Clean it.
4. Split into chunks.
5. Generate embeddings.
6. Store them in a vector database.
7. Retrieve relevant chunks at query time.
8. Pass the context to the LLM.

```python
import fitz   # PyMuPDF

def extract_pdf_text(path):
    document = fitz.open(path)
    text = ""
    for page in document:
        text += page.get_text()
    return text
```

Process files lazily or in batches, keep source and page metadata for citations, and handle scanned PDFs (OCR) and tables separately.
