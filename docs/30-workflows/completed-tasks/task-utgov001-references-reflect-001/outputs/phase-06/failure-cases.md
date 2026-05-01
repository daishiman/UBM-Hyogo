# Phase 6 Output: Failure Cases

| Failure | Handling |
| --- | --- |
| Placeholder applied JSON | BLOCKED; fetch fresh GET |
| Missing contexts | BLOCKED; do not reflect final state |
| Expected vs applied contexts differ | Reflect current facts, record drift |
| Index generation fails | Fix docs/index issue and rerun |
| Mirror diff exists | Review and synchronize intentionally |
| `Closes #303` appears | Replace with `Refs #303` |
