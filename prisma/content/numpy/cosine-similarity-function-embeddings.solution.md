Cosine similarity = `(A · B) / (‖A‖ ‖B‖)`. It measures the angle between vectors, not their length (range -1 to 1).

```python
import numpy as np

def cosine_similarity(a, b):
    a, b = np.asarray(a), np.asarray(b)
    denominator = np.linalg.norm(a) * np.linalg.norm(b)
    if denominator == 0:
        return 0.0
    return np.dot(a, b) / denominator

print(cosine_similarity([1, 2, 3], [2, 4, 6]))   # 1.0
```

**Retrieval:** compute the similarity between the query vector and every document vector, then return the top-k scores. For large collections use a vector index (FAISS, HNSW, a vector database) instead of comparing every vector in Python.
