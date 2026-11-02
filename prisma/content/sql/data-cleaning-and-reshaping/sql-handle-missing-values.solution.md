- `NULL` means unknown. `col = NULL` is never true, so use `IS NULL` / `IS NOT NULL`.
- Four options: **remove** the row, **replace** with a default (`COALESCE`), **impute** (mean, median, previous value), or **flag** it.
- For ML: impute, then keep a missing-indicator column. The fact that a value is missing is often a signal.

### Basic | Count, filter and default

```sql
-- 1. How many ages are missing?
SELECT COUNT(*) - COUNT(age) AS missing_age
FROM students;

-- 2. Treat a missing grade as "Ungraded"
SELECT name, COALESCE(grade, 'Ungraded') AS grade
FROM students;

-- 3. Keep only complete rows (read-only, nothing is deleted)
SELECT *
FROM students
WHERE age IS NOT NULL;
```

**Downside:** dropping rows loses data and can bias the training set

### Optimized | Impute per group and keep a missing flag

```sql
-- Group mean as a window function: every row stays
SELECT id, name,
       COALESCE(age, ROUND(AVG(age) OVER (PARTITION BY department))) AS age_filled,
       CASE WHEN age IS NULL THEN 1 ELSE 0 END                       AS age_was_missing
FROM students;

-- Skewed data? Use the median instead of the mean
WITH med AS (
  SELECT department,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY age) AS median_age
  FROM students
  GROUP BY department
)
SELECT s.id, s.name, COALESCE(s.age, m.median_age) AS age_filled
FROM students s
LEFT JOIN med m ON m.department = s.department;
```

**Why:** keeps every row | the flag becomes a feature | AVG ignores NULLs, so it is the mean of the known ages | Fit imputation values on training data only
