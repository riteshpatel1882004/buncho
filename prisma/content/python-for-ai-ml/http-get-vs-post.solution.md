| GET | POST |
|---|---|
| Retrieves a resource | Submits data or requests processing |
| Parameters in the URL query string | Data in the request body |
| Safe and idempotent | Not necessarily idempotent |
| Should not modify server state | May modify server state |

A prediction endpoint usually uses **POST**: inputs (feature vectors, text) can be large or sensitive, and URLs are length-limited and logged.
