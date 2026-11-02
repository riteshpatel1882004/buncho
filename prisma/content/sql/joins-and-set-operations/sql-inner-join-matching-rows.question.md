You have `customers` and `orders`.

**Table: `customers`**

| id | name |
| -- | ---- |
| 1  | Ana  |
| 2  | Raj  |
| 3  | Mei  |

**Table: `orders`**

| id  | customer_id | total |
| --- | ----------- | ----- |
| 101 | 1           | 50    |
| 102 | 1           | 30    |
| 103 | 2           | 70    |

**Task**

Write a query that returns only the rows where a customer has a matching order: the customer name, the order id and the total.

**Expected output**

| name | order_id | total |
| ---- | -------- | ----- |
| Ana  | 101      | 50    |
| Ana  | 102      | 30    |
| Raj  | 103      | 70    |

Work out your query on your own, then open **Answers & Optimization** to compare.
