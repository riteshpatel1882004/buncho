There are several correct ways to solve this. They differ in how they handle ties, how they handle departments with no second salary, and how readable they are.

### Answer 1: `DENSE_RANK()` window function (recommended)

```sql
SELECT d.department_id,
       MAX(CASE WHEN r.rnk = 2 THEN r.salary END) AS second_highest_salary
FROM (SELECT DISTINCT department_id FROM employees) AS d
LEFT JOIN (
    SELECT department_id,
           salary,
           DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
    FROM employees
) AS r
  ON r.department_id = d.department_id
GROUP BY d.department_id;
```

`DENSE_RANK()` gives tied salaries the same rank and does not skip numbers, so rank 2 is always the second distinct salary. The `LEFT JOIN` plus `MAX(CASE ...)` keeps departments that have no rank 2 and returns `NULL` for them.

### Answer 2: Correlated subquery with `MAX`

```sql
SELECT e.department_id,
       (SELECT MAX(e2.salary)
        FROM employees e2
        WHERE e2.department_id = e.department_id
          AND e2.salary < (SELECT MAX(e3.salary)
                           FROM employees e3
                           WHERE e3.department_id = e.department_id)
       ) AS second_highest_salary
FROM employees e
GROUP BY e.department_id;
```

The second highest salary is the highest salary that is lower than the maximum. It works in every SQL dialect and handles ties and `NULL` naturally, but it reads the table several times per department.

### Answer 3: Self join with `MAX`

```sql
SELECT top1.department_id,
       MAX(e.salary) AS second_highest_salary
FROM (
    SELECT department_id, MAX(salary) AS max_salary
    FROM employees
    GROUP BY department_id
) AS top1
LEFT JOIN employees e
  ON e.department_id = top1.department_id
 AND e.salary < top1.max_salary
GROUP BY top1.department_id;
```

First find each department's maximum, then join back to find the largest salary below it. This avoids window functions, so it also runs on older MySQL (before 8.0).

### Answer 4: `ROW_NUMBER()` on distinct salaries

```sql
WITH distinct_salaries AS (
    SELECT DISTINCT department_id, salary
    FROM employees
),
ranked AS (
    SELECT department_id,
           salary,
           ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rn
    FROM distinct_salaries
)
SELECT d.department_id,
       MAX(CASE WHEN r.rn = 2 THEN r.salary END) AS second_highest_salary
FROM (SELECT DISTINCT department_id FROM employees) AS d
LEFT JOIN ranked r ON r.department_id = d.department_id
GROUP BY d.department_id;
```

Removing duplicates first makes `ROW_NUMBER()` behave like `DENSE_RANK()`. It is a good option when you want to be explicit about distinct salaries.

### Answer 5: `LIMIT` / `OFFSET` (single department only)

```sql
SELECT DISTINCT salary
FROM employees
WHERE department_id = 10
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
```

This is the quickest answer for **one** department, but it does not scale to "each department" without a `LATERAL` join, and it returns no row (not `NULL`) when there is no second salary.

### Common mistakes

- Using `RANK()` instead of `DENSE_RANK()`: with two people on 9000, `RANK()` gives the next salary rank 3, so you would miss 7500.
- Using `ROW_NUMBER()` directly on `employees`: the second row is the other 9000, not the second distinct salary.
- Using an `INNER JOIN` or filtering `WHERE rnk = 2`: departments without a second salary silently disappear.
