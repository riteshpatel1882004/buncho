**What it is.** A sorted lookup structure, usually a B-tree, that lets the database find rows without scanning the whole table.

**Index types to know**

| Type | Good for |
| ---- | -------- |
| B-tree (default) | Equality, ranges, `ORDER BY` |
| Hash | Equality only |
| Bitmap | Low-cardinality columns in analytic databases |
| GIN / full-text | Text search, arrays, JSON |
| Vector (HNSW, IVFFlat) | Approximate similarity search on embeddings (pgvector) |

**Cost**

- Slower `INSERT`, `UPDATE` and `DELETE`, plus extra storage.
- Only index columns used in `WHERE`, `JOIN` and `ORDER BY`. A column with few distinct values rarely helps.
- In a composite index, column order matters: it can serve queries on its leftmost columns.

**Where it matters in ML**

- Building training sets: time-range filters and joins on entity ids.
- Point-in-time feature lookups at serving time.
- Embedding retrieval: a vector index, not a B-tree.

```sql
CREATE INDEX idx_events_user_time ON events (user_id, event_time);
```

**Interview line:** index for the read path you actually run, then confirm with `EXPLAIN`.
