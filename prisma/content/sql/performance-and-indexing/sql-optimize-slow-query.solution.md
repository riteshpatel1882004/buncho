**1. Measure first**

- Run `EXPLAIN (ANALYZE, BUFFERS)`. Look for sequential scans on big tables, large sorts, and estimated rows far from actual rows.
- Run `ANALYZE` if statistics are stale.

**2. Fix the access path**

- Index the columns used in `WHERE`, `JOIN` and `ORDER BY`. Put equality columns before range columns in a composite index.
- Use a covering index (`INCLUDE`) to get index-only scans.
- Do not over-index: every index slows writes.

**3. Rewrite the query**

- Select only the columns you need, never `SELECT *`.
- Filter early. Do not wrap an indexed column in a function.
- Use `EXISTS` instead of `IN` for large sets, and `UNION ALL` instead of `UNION` when duplicates are fine.
- Replace correlated subqueries with joins or window functions.
- Use keyset pagination instead of a large `OFFSET`.

```sql
-- Slow: the function on the column blocks the index
WHERE DATE(created_at) = '2025-01-15'

-- Fast: a range on the raw column can use the index
WHERE created_at >= '2025-01-15' AND created_at < '2025-01-16'
```

**4. Change the design if the query is still heavy**

- Partition big tables by date, or pre-aggregate into a materialized view for dashboards.
- Use the right data types (for example `INT` ids, `TIMESTAMP` for dates).

**5. Verify** on production-sized data. A fix that works on 1,000 rows proves nothing.
