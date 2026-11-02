You work with two tables.

**Table: `products`**

| Column         | Type            |
| -------------- | --------------- |
| `id`           | `INT`           |
| `product_type` | `VARCHAR(50)`   |
| `price`        | `DECIMAL(10,2)` |

**Table: `orders`**

| Column        | Type            |
| ------------- | --------------- |
| `id`          | `INT`           |
| `customer_id` | `INT`           |
| `order_date`  | `DATE`          |
| `total`       | `DECIMAL(10,2)` |

**Task**

1. Explain the difference between `WHERE` and `HAVING`.
2. Return the average price per `product_type` for products priced above 100.
3. Return each customer's total spend, only for customers who spent more than 1000 since `2025-01-01`.

