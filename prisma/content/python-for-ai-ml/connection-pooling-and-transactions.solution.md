**Connection pooling** keeps a set of open connections that requests borrow and return, instead of opening a new connection per request. This avoids connection setup cost and caps the number of connections the database must handle.

```python
from psycopg_pool import ConnectionPool

pool = ConnectionPool("dbname=test user=postgres", min_size=2, max_size=10)
with pool.connection() as conn:
    conn.execute("SELECT 1")
```

**Transaction:** a group of operations treated as one unit; all succeed or none do. **ACID**:
- **Atomicity:** all or nothing.
- **Consistency:** data moves from one valid state to another.
- **Isolation:** concurrent transactions do not see each other's partial work.
- **Durability:** committed data survives crashes.

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE acct (id INTEGER, bal INTEGER)")
db.executemany("INSERT INTO acct VALUES (?, ?)", [(1, 100), (2, 0)])
db.commit()                                    # setup is committed
try:
    with db:                                   # commit on success, rollback on error
        db.execute("UPDATE acct SET bal = bal - 50 WHERE id = 1")
        raise RuntimeError("crash before credit")
except RuntimeError:
    pass
print(db.execute("SELECT bal FROM acct WHERE id = 1").fetchone())   # (100,) rolled back
```
