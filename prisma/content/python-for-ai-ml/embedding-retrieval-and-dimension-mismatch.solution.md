**(1) Retrieval.** Small data: brute-force cosine similarity. Larger data: a vector index (FAISS, Qdrant, another vector DB).

```python
import numpy as np

def retrieve(query_embedding, embeddings, k=5):
    query = np.asarray(query_embedding)
    embeddings = np.asarray(embeddings)
    query_norm = np.linalg.norm(query)
    if query_norm == 0:
        raise ValueError("Query embedding cannot be zero")
    doc_norms = np.linalg.norm(embeddings, axis=1)
    scores = embeddings @ query / (doc_norms * query_norm + 1e-12)
    return np.argsort(scores)[-k:][::-1]

docs = np.random.default_rng(0).normal(size=(1000, 384))
print(retrieve(docs[7], docs, k=3))   # 7 first
```

In production also add metadata filters, approximate nearest-neighbour search and retrieval evaluation.

**(2) Mismatch.** Query and document embeddings must come from the **same model and dimension**. Check model names and versions, the embedding configuration and the stored vector dimension, then re-embed the documents (or the query) with the right model. **Do not truncate or pad** vectors to force them to fit.
