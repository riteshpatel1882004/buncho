- **CSV:** flat, tabular data (rows and columns). Compact and easy to load into pandas, but no nesting and no types (everything is text).
- **JSON:** supports **nested** structures and basic types. Standard for APIs and configs, but larger and slower for big tables.

Rule of thumb: CSV for datasets, JSON for API payloads and nested records. For large analytical data, consider Parquet.
