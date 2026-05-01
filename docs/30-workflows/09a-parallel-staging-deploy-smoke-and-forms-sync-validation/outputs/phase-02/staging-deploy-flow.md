# Staging Deploy Flow

```mermaid
flowchart TD
  A[dev branch ready] --> B[GitHub Actions staging deploy]
  B --> C[Cloudflare Workers API staging]
  B --> D[Cloudflare web staging]
  C --> E[Forms schema sync smoke]
  C --> F[Forms response sync smoke]
  E --> G[sync_jobs audit dump]
  F --> G
  D --> H[Playwright staging profile]
  H --> I[manual route smoke]
  G --> J[GO/NO-GO for 09c]
  I --> J
```

## Dependency Rules

| Source | Consumed as |
| --- | --- |
| 08b | scenario list and page object baseline, not proof of staging success |
| 05a/06b | auth/login/profile acceptance criteria |
| 06c/07c | admin route and attendance smoke criteria |
| 03a/03b/U-04 | sync endpoint and audit criteria |
