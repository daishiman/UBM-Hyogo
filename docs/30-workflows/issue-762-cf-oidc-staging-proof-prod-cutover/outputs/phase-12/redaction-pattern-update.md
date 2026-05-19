# Redaction Pattern Update

Added leak checks in `scripts/redaction-check.sh`:

| Pattern | Detection |
|---|---|
| JWT-like token | `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` |
| Cloudflare audience claim text | literal `cloudflare-aud` |

The existing CLI remains unchanged:

```bash
bash scripts/redaction-check.sh [--log <path>] [--account-id <id>] [--token-value-for-test <value>]
```

False-positive boundary:

- `integrity sha512-...` remains ignored by existing token-like filtering.
- JWT-like detection requires an `eyJ` prefix and two dot separators.
