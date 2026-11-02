You have a `sales` table with a timestamp column.

**Table: `sales`**

| id | transaction_date    |
| -- | ------------------- |
| 1  | 2025-03-01 09:30:00 |
| 2  | 2025-03-03 18:00:00 |
| 3  | 2025-03-03 21:45:00 |

**Task**

Build features for a model from `transaction_date`:

- year, month, day, day of week and an `is_weekend` flag
- the hour of day as a cyclical feature (sine and cosine)
- the time since the previous transaction

**Expected output (some columns)**

| id | day_of_week | is_weekend | time_since_prev |
| -- | ----------- | ---------- | --------------- |
| 1  | 6           | 1          | NULL            |
| 2  | 1           | 0          | 2 days 08:30:00 |
| 3  | 1           | 0          | 03:45:00        |

Work out your query on your own, then open **Answers & Optimization** to compare.
