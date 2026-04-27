# Phase 6 Failure Path Review

## Failure Matrix

| Failure | Expected handling |
| --- | --- |
| Cloudflare deployment fails | Keep previous deployment active and use Cloudflare rollback |
| D1 migration is unavailable | Stop promotion and keep Sheets as upstream input only |
| Secret is missing | Do not write values into docs; resolve via Cloudflare / GitHub / 1Password owner |
| Path drift appears | Fix task root and artifacts before Phase 13 |
| `05a` evidence is late | Continue until Phase 10-12 sync point |
