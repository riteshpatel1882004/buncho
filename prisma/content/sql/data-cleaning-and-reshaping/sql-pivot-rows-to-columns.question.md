You have a `salesdata` table with one row per sale.

**Table: `salesdata`**

| sale_date  | product | quantity | amount |
| ---------- | ------- | -------- | ------ |
| 2020-01-01 | Apples  | 10       | 50     |
| 2020-01-01 | Oranges | 8        | 40     |
| 2020-02-01 | Apples  | 12       | 60     |
| 2020-02-01 | Oranges | 15       | 75     |

**Task**

Pivot the table so there is one row per date and one column per product holding the total `amount`.

**Expected output**

| sale_date  | apples | oranges |
| ---------- | ------ | ------- |
| 2020-01-01 | 50     | 40      |
| 2020-02-01 | 60     | 75      |

Work out your query on your own, then open **Answers & Optimization** to compare.
