1. **Reproduce** it with the exact failing input.
2. Check the **input** and **preprocessing** for empty or unexpected values.
3. Inspect **exception handlers** that return `None` and swallow the error.
4. Check the **model load and prediction paths** for branches with no `return`.
5. **Log** request IDs, inputs and the full traceback (`logger.exception`).
6. Add **input and output validation** so `None` fails loudly.

A common cause is an `except` block that returns `None` without logging the original exception, or a code path where a function falls off the end without a `return`.
