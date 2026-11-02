- **Index:** `CREATE INDEX idx_emp_dept_salary ON employees (department_id, salary DESC);`
- **Full report:** use *Window MAX, single pass*. One scan, no sort.
- **Few departments, millions of rows:** use *LATERAL top 2*. It reads only the top rows per department through the index.
- **Index-only scan:** select just `department_id` and `salary`.
- **Read-heavy report:** keep the result in a materialized view and refresh it on a schedule.
- **Check:** run `EXPLAIN (ANALYZE, BUFFERS)` on real data volume.

**Common mistakes**

- `RANK()` skips numbers after ties, so rank 2 can be missing. Use `DENSE_RANK()`.
- `ROW_NUMBER()` on raw rows returns the second 9000, not 7500.
- `WHERE rnk = 2` or an `INNER JOIN` drops departments with no second salary. Aggregate with `MAX(CASE ...)` instead.
