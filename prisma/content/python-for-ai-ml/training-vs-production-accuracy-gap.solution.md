**Possible causes**
- **Data leakage** in training or validation.
- **Distribution shift** between training and production data.
- **Overfitting**.
- Preprocessing that differs between training and serving.
- Different **feature order**.
- Missing values handled differently.
- Different **label definitions**.
- Production data quality problems.

**First step:** verify that production preprocessing exactly matches training. The safest way is to save one object that contains both.

```python
import joblib
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

pipe = make_pipeline(StandardScaler(), LogisticRegression())
pipe.fit([[0], [1], [2], [3]], [0, 0, 1, 1])
joblib.dump(pipe, "pipeline.pkl")            # scaler + model together
print(joblib.load("pipeline.pkl").predict([[0], [3]]))
```

Then compare feature distributions (train vs production) and check for leakage.
