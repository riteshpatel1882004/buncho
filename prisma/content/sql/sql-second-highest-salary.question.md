You work on the people-analytics team and are given an `employees` table.

**Table: `employees`**

| Column          | Type          | Notes                          |
| --------------- | ------------- | ------------------------------ |
| `id`            | `INT`         | Primary key                    |
| `name`          | `VARCHAR(50)` |                                |
| `department_id` | `INT`         | Many employees per department  |
| `salary`        | `INT`         | Can be shared by employees     |

**Sample data**

| id | name  | department_id | salary |
| -- | ----- | ------------- | ------ |
| 1  | Asha  | 10            | 9000   |
| 2  | Ben   | 10            | 9000   |
| 3  | Chen  | 10            | 7500   |
| 4  | Divya | 10            | 6000   |
| 5  | Emma  | 20            | 8000   |
| 6  | Farid | 20            | 5000   |
| 7  | Gita  | 30            | 7000   |

**Task**

Write a query that returns the **second highest distinct salary in each department**, together with the `department_id`.

- If two employees share the highest salary, the second highest is the next *lower* distinct salary.
- If a department has no second highest salary (for example department 30), it should still appear with `NULL`.

**Expected output**

| department_id | second_highest_salary |
| ------------- | --------------------- |
| 10            | 7500                  |
| 20            | 5000                  |
| 30            | NULL                  |

Write your query in the editor on the right. Then open the **Answers & Optimization** tab to compare it with every approach and see how to make it fast on a large table.
