# Manual Smoke Log

| Check | Result |
| --- | :---: |
| `0001_init.sql` apply | PASS |
| `0002_admin_managed.sql` apply | PASS |
| `0003_auth_support.sql` apply | PASS |
| `0004_seed_tags.sql` apply | PASS |
| Expected schema object count | PASS: 20 physical tables + 1 view |
| Seed category counts | PASS: 6 categories / 41 rows |

Remote apply is a Phase 13 / CI operation and was not executed in this review.
