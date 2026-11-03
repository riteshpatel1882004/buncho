```python
names = ["a", "b", "c"]
scores = [90, 70, 85]

print(list(enumerate(names)))            # [(0, 'a'), (1, 'b'), (2, 'c')]  index-value pairs
print(list(zip(names, scores)))          # [('a', 90), ('b', 70), ('c', 85)]  element-wise
print(any(s < 60 for s in scores))       # False: at least one truthy?
print(all(s >= 60 for s in scores))      # True: all truthy?
```

`zip` stops at the shortest input (`itertools.zip_longest` pads). `any`/`all` **short-circuit** and work well with generator expressions.
