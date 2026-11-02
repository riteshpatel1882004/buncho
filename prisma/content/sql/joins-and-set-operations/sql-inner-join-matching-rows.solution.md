- `INNER JOIN` keeps only rows with a match on the join condition. Mei has no orders, so she is dropped.
- `ON` handles any condition. `USING (col)` is a shorthand when both columns share a name.

### Basic | INNER JOIN with ON

```sql
SELECT *
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;
```

**Problem:** SELECT * returns both id columns and every column you do not need

### Optimized | Aliases, needed columns, indexed key

```sql
CREATE INDEX idx_orders_customer_id ON orders (customer_id);

SELECT c.name, o.id AS order_id, o.total
FROM customers c
JOIN orders o ON o.customer_id = c.id;

-- Only customer columns needed? A semi-join returns each customer once, no duplicates
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

**Dialects:** USING (col) works in PostgreSQL, MySQL and Oracle, not in SQL Server | JOIN alone means INNER JOIN
