You have an `orders` table.

**Table: `orders`**

| order_id | customer_id | order_date | amount |
| -------- | ----------- | ---------- | ------ |
| 1        | 1           | 2025-01-01 | 100    |
| 2        | 1           | 2025-01-05 | 150    |
| 3        | 1           | 2025-01-10 | 50     |
| 4        | 2           | 2025-01-02 | 80     |
| 5        | 2           | 2025-01-08 | 120    |

**Task**

1. What is a window function and how does it differ from `GROUP BY`?
2. For every order return: the order number for that customer, the previous order amount, and the running total for that customer.

**Expected output (part 2)**

| order_id | order_seq | prev_amount | running_total |
| -------- | --------- | ----------- | ------------- |
| 1        | 1         | NULL        | 100           |
| 2        | 2         | 100         | 250           |
| 3        | 3         | 150         | 300           |
| 4        | 1         | NULL        | 80            |
| 5        | 2         | 80          | 200           |

Work out your query on your own, then open **Answers & Optimization** to compare.
