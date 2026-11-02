- A **subquery** is a `SELECT` nested inside another statement (in `WHERE`, `FROM` or `SELECT`).
- **Uncorrelated:** independent of the outer query, runs once.
- **Correlated:** refers to the outer row, so it is conceptually evaluated per outer row.
- Typical uses: filter by another table (`IN` / `EXISTS`), compare with an aggregate, build a derived table.
- `NOT IN` returns nothing if the subquery contains a `NULL`. Use `NOT EXISTS`.

### Basic | IN with an uncorrelated subquery

```sql
SELECT *
FROM customers
WHERE city = 'London'
  AND customer_id IN (SELECT customer_id
                      FROM orders
                      WHERE order_date >= CURRENT_DATE - INTERVAL '1 month');
```

**SQL Server:** use DATEADD(month, -1, GETDATE()) instead of the INTERVAL expression

### Optimized | EXISTS with a supporting index

```sql
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);

SELECT c.*
FROM customers c
WHERE c.city = 'London'
  AND EXISTS (SELECT 1
              FROM orders o
              WHERE o.customer_id = c.customer_id
                AND o.order_date >= CURRENT_DATE - INTERVAL '1 month');

-- Safe "not in": customers with no orders at all
SELECT c.*
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

**Why:** EXISTS stops at the first match and the index makes each lookup cheap | Modern planners often rewrite IN to a semi-join, so check EXPLAIN
