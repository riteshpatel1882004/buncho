You have two tables.

**Table: `customers`**

| customer_id | name  | city   |
| ----------- | ----- | ------ |
| 1           | Ana   | London |
| 2           | Raj   | London |
| 3           | Mei   | Paris  |

**Table: `orders`**

| order_id | customer_id | order_date | total |
| -------- | ----------- | ---------- | ----- |
| 10       | 1           | 2025-05-20 | 80    |
| 11       | 2           | 2024-11-02 | 45    |
| 12       | 3           | 2025-05-22 | 60    |

**Task**

1. What is a subquery? What is the difference between a correlated and an uncorrelated one?
2. Return every customer in London who placed an order in the last month. Assume today is `2025-06-01`.

**Expected output**

| customer_id | name | city   |
| ----------- | ---- | ------ |
| 1           | Ana  | London |

Answer in your own words first, then open **Answers & Optimization** to compare.
