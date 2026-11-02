- A subquery is a query nested inside another SQL query (such as SELECT, INSERT, UPDATE, or DELETE) to handle multi-step data operations and dynamic filtering. 
- **Scalar Subquery:** Returns a single row and a single column (one value).
- **Multi-Row Subquery:** Returns a single column with multiple rows, often used with operators like IN, ANY, or ALL.
- **Correlated Subquery:** References one or more columns from the outer query. It re-evaluates for each row processed by the main query.

### Basic | IN with an uncorrelated subquery

```sql
SELECT *
FROM customers
WHERE city = 'London'
AND customer_id IN (
      SELECT customer_id
      FROM orders
      WHERE order_date >= DATE '2025-05-01'
            AND order_date < DATE '2025-06-01'
  );
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
