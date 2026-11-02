- `COUNT(*)` counts rows. `COUNT(col)` skips `NULL`s.
- `SUM`, `AVG`, `MIN` and `MAX` ignore `NULL`s. On an empty set they return `NULL`.
- Without `GROUP BY` the aggregate covers the whole result set. With it, one result per group.

### Basic | One query per metric

```sql
SELECT COUNT(id)          AS num_orders      FROM orders;
SELECT SUM(total_amount)  AS total_sales     FROM orders;
SELECT AVG(total_amount)  AS avg_order_value FROM orders;
SELECT MAX(total_amount)  AS max_order_value FROM orders;
SELECT MIN(total_amount)  AS min_order_value FROM orders;

SELECT customer_id, COUNT(id) AS num_orders, SUM(total_amount) AS total_spent
FROM orders
GROUP BY customer_id;
```

**Cost:** five full scans of the table for part 1

### Optimized | All metrics in one scan

```sql
SELECT COUNT(*)                     AS num_orders,
       SUM(total_amount)            AS total_sales,
       ROUND(AVG(total_amount), 2)  AS avg_order_value,
       MAX(total_amount)            AS max_order_value,
       MIN(total_amount)            AS min_order_value
FROM orders;

SELECT customer_id,
       COUNT(*)           AS num_orders,
       SUM(total_amount)  AS total_spent,
       SUM(CASE WHEN total_amount > 40 THEN 1 ELSE 0 END) AS big_orders  -- conditional aggregate
FROM orders
GROUP BY customer_id
ORDER BY total_spent DESC;
```

**Why:** one pass over the data instead of five | CASE inside an aggregate counts a condition without a second query | PostgreSQL also has COUNT(*) FILTER (WHERE ...)
