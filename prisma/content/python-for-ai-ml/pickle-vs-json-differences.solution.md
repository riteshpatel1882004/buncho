| Pickle | JSON |
|---|---|
| Python-specific | Language-independent |
| Supports many Python objects | Limited types (dict, list, str, number, bool, null) |
| Binary by default | Text |
| Can serialize model objects | Cannot serialize arbitrary objects directly |
| **Unsafe** for untrusted input | Safer to parse, but still validate |

Use **JSON** for APIs, configs and metrics. Use **pickle/joblib** only for trusted internal artifacts such as fitted models.
