- `UNION` removes duplicates, which needs a sort or hash step.
- `UNION ALL` keeps every row and skips that work, so it is faster.
- Both queries need the same number of columns with compatible types. Column names come from the first query.

### Basic | UNION

```sql
SELECT employee_id AS person_id FROM full_time_employees
UNION
SELECT intern_id FROM interns;
```

**Cost:** the whole combined result is sorted or hashed to find duplicates

### Optimized | UNION ALL, deduplicate only where needed

```sql
-- Ids can never overlap between the tables? UNION ALL is enough
SELECT employee_id AS person_id FROM full_time_employees
UNION ALL
SELECT intern_id FROM interns;

-- Overlap possible, but employee_id is unique inside its own table:
-- remove only the cross-table duplicates with an anti-join
SELECT employee_id AS person_id
FROM full_time_employees
UNION ALL
SELECT i.intern_id
FROM interns i
WHERE NOT EXISTS (SELECT 1 FROM full_time_employees f WHERE f.employee_id = i.intern_id);
```

**Rule:** use UNION ALL by default, UNION only when duplicates are possible and unwanted | Add ORDER BY once, at the very end
