Use threads when tasks spend most of their time **waiting on I/O**:

- Calling multiple external LLM or embedding APIs.
- Downloading documents or images.
- Fetching data from APIs.
- Reading many files.
- Waiting for database responses.

For pure-Python CPU-heavy work, threads will not help because of the GIL.
