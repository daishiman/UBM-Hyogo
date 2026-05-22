# Redaction Check

Status: `PASS`

Runtime evidence must not include `raw_json`, full IP addresses, full user agents, token values, actor email addresses, GitHub secrets, or Cloudflare secrets. D1 queries must aggregate with `COUNT`, `GROUP BY`, `MIN`, and `MAX`; they must not select raw audit event payloads.

## 2026-05-08 Check

| Evidence | Result |
| --- | --- |
| GitHub run / issue outputs | PASS: metadata only |
| D1 output | PASS: redacted error payload only, account value concealed by project tooling |
| raw audit JSON | PASS: not selected |
| secret values | PASS: not printed |
