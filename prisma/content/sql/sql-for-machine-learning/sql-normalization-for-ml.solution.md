**1. Database normalization (1NF to 3NF)**

- Splits data into related tables so each fact is stored once. Removes redundancy and update anomalies, and keys keep the data consistent.
- Cost: more joins at read time.
- For ML and analytics, the training table is often **denormalized** on purpose into one wide row per entity, because reads matter more than write integrity.

**2. Feature normalization (scaling)**

- Min-max scaling squeezes values into 0 to 1. Z-score centers on the mean with unit variance.
- Needed for distance-based and gradient-based models: k-means, KNN, SVM, linear models, neural networks.
- Not needed for tree models (random forest, XGBoost).
- Compute the mean and standard deviation on the **training split only**, then reuse them on validation and test data. Otherwise you leak information.

```sql
-- Z-score in SQL (compute the statistics on training rows only in real pipelines)
SELECT id,
       (amount - AVG(amount) OVER ()) / NULLIF(STDDEV_SAMP(amount) OVER (), 0) AS amount_z
FROM transactions;
```

**Interview line:** normalize the database for integrity, denormalize the feature table for speed, and scale features inside the ML pipeline.
