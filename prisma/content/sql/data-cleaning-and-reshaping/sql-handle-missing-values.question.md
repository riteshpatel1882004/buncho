You have a `students` table with missing values.

**Table: `students`**

| id | name | age  | department | grade |
| -- | ---- | ---- | ---------- | ----- |
| 1  | Ana  | 20   | CS         | A     |
| 2  | Raj  | NULL | CS         | NULL  |
| 3  | Mei  | 24   | CS         | B     |
| 4  | Sam  | 30   | Math       | NULL  |
| 5  | Zoe  | NULL | Math       | C     |

**Task**

1. Count how many ages are missing.
2. Show every student with a missing `grade` as `'Ungraded'`.
3. Fill each missing `age` with the average age of the student's department, without deleting any row, and add a flag column that says the age was missing.

**Expected output (part 3)**

| id | name | age_filled | age_was_missing |
| -- | ---- | ---------- | --------------- |
| 1  | Ana  | 20         | 0               |
| 2  | Raj  | 22         | 1               |
| 3  | Mei  | 24         | 0               |
| 4  | Sam  | 30         | 0               |
| 5  | Zoe  | 30         | 1               |

Work out your queries on your own, then open **Answers & Optimization** to compare.
