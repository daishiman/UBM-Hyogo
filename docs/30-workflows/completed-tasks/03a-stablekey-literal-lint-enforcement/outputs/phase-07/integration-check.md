# Integration Check

| Check | Expected |
| --- | --- |
| `pnpm lint` clean tree | exit 0 |
| intentional stableKey literal outside allow-list | exit non-zero |
| `git grep -c 'eslint-disable.*no-stablekey-literal'` | 0 |
| allow-list snapshot paths | repo-relative only |
