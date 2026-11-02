- `GROUP BY` puts rows with the same values into one group, then aggregate functions run once per group.
- Every selected column must be either in `GROUP BY` or wrapped in an aggregate.
- You can group by several columns. A group is each unique combination.
- `ROLLUP` adds subtotals and a grand total. `CUBE` adds every combination. `GROUPING SETS` lets you pick the combinations.

### Basic | One level at a time

```sql
-- Total revenue per region
SELECT region, SUM(revenue) AS total_revenue
FROM sales
GROUP BY region;

-- Total revenue per region and product
SELECT region, product, SUM(revenue) AS total_revenue
FROM sales
GROUP BY region, product;
```

**Result:** North 2000, South 2700 | subtotals and a grand total would need extra queries

### Optimized | ROLLUP in a single pass

```sql
CREATE INDEX idx_sales_date_region_product ON sales (sale_date, region, product) INCLUDE (revenue);

SELECT region, product, SUM(revenue) AS total_revenue
FROM sales
WHERE sale_date >= DATE '2025-01-01'
GROUP BY ROLLUP (region, product)
ORDER BY region, product;
```

**Output:** detail rows, a subtotal per region (product is NULL) and a grand total (both NULL) | MySQL syntax: GROUP BY region, product WITH ROLLUP | Use GROUPING(col) to tell a subtotal NULL from a real NULL
