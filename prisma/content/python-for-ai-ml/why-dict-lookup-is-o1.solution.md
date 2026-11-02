A dict is a **hash table**: the key's hash decides where its value is stored, so Python jumps to the slot without scanning.

- Average lookup, insert and delete: **O(1)**.
- Worst case (many hash collisions): **O(n)**, which is rare with good hashes.
- Searching a list for an ID is **O(n)** per lookup.

```python
rows = [(1, [0.1, 0.2]), (42, [0.3, 0.4])]   # (user_id, embedding)
emb = {user_id: vec for user_id, vec in rows}
vec = emb[42]            # O(1) on average
```

Cost: a dict uses more memory than a list. If IDs are dense integers `0..N-1`, a NumPy array indexed by ID is cheaper still.
