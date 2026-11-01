Assume `employees` has millions of rows and this query runs often.

**1. Index for the partition and sort**

```sql
CREATE INDEX idx_employees_dept_salary ON employees (department_id, salary DESC);
```

The window function (and the correlated subqueries) read rows grouped by `department_id` and ordered by `salary`. A composite index in that exact order lets the database read rows already sorted, so it can skip the expensive sort step. Check with `EXPLAIN` that a `Sort` node disappears from the plan.

**2. Shrink the data before ranking**

If many employees share a salary, rank only the distinct values:

```sql
WITH distinct_salaries AS (
    SELECT DISTINCT department_id, salary FROM employees
)
SELECT ... FROM distinct_salaries ...
```

Ranking 50 distinct salaries per department is much cheaper than ranking 50,000 employees.

**3. Pick the approach that matches the engine**

| Approach                  | Table scans              | Best for                                       |
| ------------------------- | ------------------------ | ---------------------------------------------- |
| `DENSE_RANK()` window     | 1                        | Modern engines (Postgres, MySQL 8+, SQL Server) |
| Correlated subquery       | Several per department   | Small tables, old engines                       |
| Self join on `MAX`        | 2                        | Old MySQL without window functions              |
| `LIMIT` / `OFFSET`        | 1 per department queried | One known department                            |

On large tables the window function with the composite index is almost always fastest, because it reads the table once.

**4. Avoid recomputing**

- Return only the columns you need (`department_id`, `salary`) in the inner query so the engine can use an **index-only scan**.
- If the report is read far more often than the data changes, store the result in a **materialised view** and refresh it on a schedule.
- For top-N per group at very large scale, a `LATERAL` join with `ORDER BY salary DESC LIMIT 2` per department can beat ranking everything, when the number of departments is small.

**5. Verify, do not guess**

Run `EXPLAIN (ANALYZE, BUFFERS)` on each version with realistic data volume. Compare rows read, sort cost and time, and keep the simplest query that is fast enough.
