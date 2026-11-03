CPython uses:

- A **private heap** that holds all objects.
- **Reference counting**: an object is freed when its count reaches zero. This handles most objects.
- A **cyclic garbage collector** for unreachable reference cycles.
- Internal **memory allocators** (for example pymalloc for small objects).

Memory may not return to the OS immediately after objects are freed, so process memory can stay high.
