- A window function computes over a set of related rows but **keeps every row**. `GROUP BY` collapses rows into one per group.
- `PARTITION BY` splits the rows into groups, `ORDER BY` orders them inside each group, and the frame (`ROWS BETWEEN ...`) picks the rows around the current one.
- Feature-engineering staples: `LAG` / `LEAD` (previous and next values), running and rolling sums and averages, `ROW_NUMBER` / `RANK` / `NTILE`.
- Avoid leakage: a feature for a given row must only use earlier rows, so end the frame at `1 PRECEDING`.

### Basic | Separate window expressions

```sql
SELECT order_id, customer_id, order_date, amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS order_seq,
       LAG(amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount,
       SUM(amount)  OVER (PARTITION BY customer_id ORDER BY order_date) AS running_total
FROM orders;
```

**Repetition:** the same window is spelled out three times | With ORDER BY and no frame, rows with equal dates share one running total

### Optimized | Named window, explicit frames, no leakage

```sql
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date);

SELECT order_id, customer_id, order_date, amount,
       amount - LAG(amount) OVER w                                    AS delta_prev,
       SUM(amount) OVER (w ROWS UNBOUNDED PRECEDING)                  AS running_total,
       AVG(amount) OVER (w ROWS BETWEEN 3 PRECEDING AND 1 PRECEDING)  AS avg_prev_3
FROM orders
WINDOW w AS (PARTITION BY customer_id ORDER BY order_date);
```

**Why:** the window is defined once | the index on (customer_id, order_date) lets the planner skip the sort | ROWS makes the running total exact on ties | avg_prev_3 excludes the current row, so it is safe as a model feature | WINDOW clause: PostgreSQL, MySQL 8+, SQL Server 2022+
