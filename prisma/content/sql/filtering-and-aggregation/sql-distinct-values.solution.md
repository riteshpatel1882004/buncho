- `DISTINCT` removes duplicate **rows** across all the selected columns, not just the first one.
- `COUNT(DISTINCT col)` counts unique non-`NULL` values.
- `DISTINCT` and `GROUP BY` give the same result here and usually the same plan.

### Basic | DISTINCT with ORDER BY

```sql
SELECT DISTINCT grade
FROM students_info
ORDER BY grade;

SELECT COUNT(DISTINCT grade) AS unique_grades
FROM students_info;
```

**Result:** 9, 10, 11 | unique_grades = 3

### Optimized | Index the column, skip work you do not need

```sql
-- With this index the engine can read the index only, not the whole table
CREATE INDEX idx_students_grade ON students_info (grade);

SELECT grade
FROM students_info
GROUP BY grade
ORDER BY grade;

-- Only need to know whether a value exists? Stop at the first match
SELECT EXISTS (SELECT 1 FROM students_info WHERE grade = 10) AS has_grade_10;
```

**Tip:** drop ORDER BY when the order does not matter, sorting is the costly part | DISTINCT on many columns is slow on big tables, check if you really need every column
