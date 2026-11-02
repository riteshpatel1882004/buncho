- A pivot turns row values (the products) into columns.
- **Static pivot:** you know the column values up front. **Dynamic pivot:** values are discovered at runtime, which needs dynamic SQL.
- Conditional aggregation works in every database. `PIVOT` (SQL Server) and `crosstab()` (PostgreSQL) are dialect-specific.

### Basic | Conditional aggregation (works everywhere)

```sql
SELECT sale_date,
       SUM(CASE WHEN product = 'Apples'  THEN amount ELSE 0 END) AS apples,
       SUM(CASE WHEN product = 'Oranges' THEN amount ELSE 0 END) AS oranges
FROM salesdata
GROUP BY sale_date
ORDER BY sale_date;
```

**Limit:** every new product means editing the query

### Optimized | One scan with FILTER or PIVOT

```sql
-- PostgreSQL: FILTER keeps the intent clear and runs in one pass
SELECT sale_date,
       COALESCE(SUM(amount) FILTER (WHERE product = 'Apples'),  0) AS apples,
       COALESCE(SUM(amount) FILTER (WHERE product = 'Oranges'), 0) AS oranges
FROM salesdata
GROUP BY sale_date
ORDER BY sale_date;

-- SQL Server: PIVOT
SELECT sale_date, [Apples], [Oranges]
FROM (SELECT sale_date, product, amount FROM salesdata) src
PIVOT (SUM(amount) FOR product IN ([Apples], [Oranges])) p;
```

**Unknown product list:** build the column list with dynamic SQL, or pivot in pandas with pivot_table | Index (sale_date, product) INCLUDE (amount) on large tables
