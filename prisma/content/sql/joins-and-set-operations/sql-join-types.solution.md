- **INNER JOIN:** only the rows that match in both tables.
- **LEFT JOIN:** every row from the left table, plus matches from the right (`NULL` when there is none).
- **RIGHT JOIN:** the mirror image: every row from the right table.
- **FULL JOIN:** every row from both tables, `NULL` where there is no match.
- **CROSS JOIN:** every left row paired with every right row.

### Basic | One query per join type

```sql
-- INNER JOIN: matching rows only
SELECT e.name, d.name AS department
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- LEFT JOIN: every employee, even without a department
SELECT e.name, d.name AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- RIGHT JOIN: every department, even without employees
SELECT e.name, d.name AS department
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

-- FULL JOIN: every row from both tables
SELECT e.name, d.name AS department
FROM employees e
FULL JOIN departments d ON e.department_id = d.id;
```

**Rows returned:** INNER 4, LEFT 4, RIGHT 5, FULL 5 | IT has no employees, so it only appears in RIGHT and FULL

### Optimized | Index the join key, return only what you need

```sql
-- 1. Index the join key (PostgreSQL does not index foreign keys on its own)
CREATE INDEX idx_employees_department_id ON employees (department_id);

-- 2. Use the narrowest join and only the columns you need
SELECT e.name, d.name AS department
FROM employees e
JOIN departments d ON d.id = e.department_id;

-- 3. "Departments with no employees": anti-join instead of RIGHT JOIN + IS NULL
SELECT d.name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.department_id = d.id);
```

**Tip:** use INNER JOIN unless you really need the unmatched rows | MySQL has no FULL JOIN: combine LEFT JOIN and RIGHT JOIN with UNION
