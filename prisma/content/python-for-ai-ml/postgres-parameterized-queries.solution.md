```python
import psycopg

conn = psycopg.connect("dbname=test user=postgres password=secret")
with conn.cursor() as cur:
    cur.execute("SELECT * FROM users WHERE id = %s", (1,))   # parameterized
    result = cur.fetchall()
conn.close()
```

**SQL injection:** untrusted input becomes part of the SQL command. **Prevent it with parameterized queries**; the driver sends values separately from the SQL text. Never build SQL with f-strings or `+`.

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE users (email TEXT)")
db.execute("INSERT INTO users VALUES ('a@x.com')")

evil = "' OR '1'='1"
unsafe = f"SELECT * FROM users WHERE email = '{evil}'"
print(len(db.execute(unsafe).fetchall()))                          # 1: injection matched every row
print(len(db.execute("SELECT * FROM users WHERE email = ?", (evil,)).fetchall()))   # 0
```

(`sqlite3` uses `?`; psycopg uses `%s`.) Also use a least-privilege database user.
