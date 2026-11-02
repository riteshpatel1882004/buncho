- Calendar parts (`EXTRACT`) give simple numeric features.
- Hour, day of week and month are **cyclical**: hour 23 is next to hour 0. Encode them as `sin` and `cos` so the model sees that.
- Gaps between events (`LAG`) are strong features for churn, fraud and demand models.

### Basic | EXTRACT every calendar part

```sql
SELECT id, transaction_date,
       EXTRACT(YEAR  FROM transaction_date) AS year,
       EXTRACT(MONTH FROM transaction_date) AS month,
       EXTRACT(DAY   FROM transaction_date) AS day,
       EXTRACT(DOW   FROM transaction_date) AS day_of_week,
       CASE WHEN EXTRACT(DOW FROM transaction_date) IN (0, 6) THEN 1 ELSE 0 END AS is_weekend,
       EXTRACT(HOUR  FROM transaction_date) AS hour
FROM sales;
```

**PostgreSQL:** DOW runs 0 (Sunday) to 6 | MySQL uses DAYOFWEEK(), where 1 is Sunday

### Optimized | One pass: cyclical encoding and LAG

```sql
WITH t AS (
  SELECT id, transaction_date,
         EXTRACT(HOUR FROM transaction_date) + EXTRACT(MINUTE FROM transaction_date) / 60.0 AS hour_of_day
  FROM sales
)
SELECT id, transaction_date,
       EXTRACT(DOW FROM transaction_date)                  AS day_of_week,
       SIN(2 * PI() * hour_of_day / 24)                    AS tod_sin,
       COS(2 * PI() * hour_of_day / 24)                    AS tod_cos,
       transaction_date
         - LAG(transaction_date) OVER (ORDER BY transaction_date) AS time_since_prev
FROM t
ORDER BY transaction_date;
```

**Why sin and cos:** a raw hour number says 23 and 0 are far apart | Per-customer gaps: add PARTITION BY customer_id inside OVER | Index the timestamp column so the ORDER BY needs no sort
