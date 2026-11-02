### Brute force | Nested MAX subquery

```sql
SELECT d.department_id,
       (SELECT MAX(e.salary)
        FROM employees e
        WHERE e.department_id = d.department_id
          AND e.salary < (SELECT MAX(salary)
                          FROM employees
                          WHERE department_id = d.department_id)) AS second_highest_salary
FROM (SELECT DISTINCT department_id FROM employees) d;
```

**Time:** O(d · n) | **Scans:** 2 per department | **Engines:** all

### Brute force | Count higher distinct salaries

```sql
SELECT d.department_id,
       (SELECT MAX(e1.salary)
        FROM employees e1
        WHERE e1.department_id = d.department_id
          AND (SELECT COUNT(DISTINCT e2.salary)
               FROM employees e2
               WHERE e2.department_id = d.department_id
                 AND e2.salary > e1.salary) = 1) AS second_highest_salary
FROM (SELECT DISTINCT department_id FROM employees) d;
```

**Time:** O(n²) | **Scans:** 1 per row | **Engines:** all | Slowest option

### Better | Join on department MAX

```sql
SELECT m.department_id,
       MAX(e.salary) AS second_highest_salary
FROM (SELECT department_id, MAX(salary) AS max_salary
      FROM employees
      GROUP BY department_id) m
LEFT JOIN employees e
       ON e.department_id = m.department_id
      AND e.salary < m.max_salary
GROUP BY m.department_id;
```

**Time:** O(n) with hash join | **Scans:** 2 | **Engines:** all, incl. MySQL 5.x

### Optimized | DENSE_RANK()

```sql
SELECT department_id,
       MAX(CASE WHEN rnk = 2 THEN salary END) AS second_highest_salary
FROM (SELECT department_id,
             salary,
             DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
      FROM employees) t
GROUP BY department_id;
```

**Time:** O(n log n) | **Scans:** 1 | Most readable, the usual interview answer

### Optimized | Window MAX, single pass

```sql
SELECT department_id,
       MAX(CASE WHEN salary < max_salary THEN salary END) AS second_highest_salary
FROM (SELECT department_id,
             salary,
             MAX(salary) OVER (PARTITION BY department_id) AS max_salary
      FROM employees) t
GROUP BY department_id;
```

**Time:** O(n) | **Scans:** 1 | No sort needed | Fastest for a full report

### Optimized | LATERAL top 2 with an index

```sql
SELECT d.department_id,
       s.salary AS second_highest_salary
FROM (SELECT DISTINCT department_id FROM employees) d
LEFT JOIN LATERAL (
    SELECT DISTINCT salary
    FROM employees e
    WHERE e.department_id = d.department_id
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
) s ON TRUE;
```

**Time:** O(d · log n) | **Needs:** index on (department_id, salary DESC) | **Engines:** PostgreSQL, MySQL 8.0.14+ | Best for few departments, many rows
