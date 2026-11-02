- **WHERE** filters individual rows *before* grouping. It cannot use aggregates.
- **HAVING** filters groups *after* `GROUP BY`. It can use aggregates such as `SUM` and `COUNT`.
- Logical order: `FROM` -> `WHERE` -> `GROUP BY` -> `HAVING` -> `SELECT` -> `ORDER BY`.
- Put every non-aggregate condition in `WHERE`. Fewer rows reach the grouping step and the filter can use an index.

### Basic | WHERE for rows, HAVING for groups

```sql
-- WHERE: filter rows before grouping
SELECT product_type, AVG(price) AS avg_price
FROM products
WHERE price > 100
GROUP BY product_type;

-- HAVING: filter groups after aggregation
SELECT customer_id, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 1000;
```

**Remember:** a condition on a raw column belongs in WHERE | a condition on SUM, COUNT or AVG belongs in HAVING

### Optimized | Filter early, then aggregate

```sql
-- Covering index: the filter column first, the grouped column next, the summed column included
CREATE INDEX idx_orders_date_customer ON orders (order_date, customer_id) INCLUDE (total);

SELECT customer_id, SUM(total) AS total_spent
FROM orders
WHERE order_date >= DATE '2025-01-01'   -- row filter: uses the index, shrinks the input
GROUP BY customer_id
HAVING SUM(total) > 1000;               -- group filter: only what WHERE cannot do
```

**Why it is faster:** the date filter runs before grouping, so far fewer rows are aggregated | INCLUDE works in PostgreSQL 11+ and SQL Server
