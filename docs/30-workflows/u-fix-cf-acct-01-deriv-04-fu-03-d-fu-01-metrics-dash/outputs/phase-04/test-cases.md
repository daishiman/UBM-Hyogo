# Test Cases

Refs #549, Refs #586, Refs #656.

- versioned summary accepted
- `schema_version: "1.0.0"` without `week_starting` derives ISO week
- missing schema version warns and skips
- unsupported explicit version throws
- non-string schema version throws
- four weeks aggregate in order
- missing weeks remain gaps
- threshold / mixed / ml period classification
