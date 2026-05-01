# Production Deploy Preflight: Worker Route / Secret / Observability

## 0. Preconditions

- User approval for verification has been obtained.
- All commands use `bash scripts/cf.sh`.
- Secret values are never printed or copied into evidence.
- Production deploy itself is outside this workflow.

## 1. Worker Inventory

| Worker | Expected | Actual | Result |
| --- | --- | --- | --- |
| `ubm-hyogo-web-production` | exists | TBD | TBD |
| legacy Worker | retained until stable cutover | TBD | TBD |

## 2. Route / Custom Domain

| Route or domain | Expected Worker | Actual Worker | Action |
| --- | --- | --- | --- |
| production route | `ubm-hyogo-web-production` | TBD | block deploy if mismatched |

## 3. Secret Snapshot

Run only through the project wrapper:

```bash
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
```

Record key names only. Missing keys block deploy approval. Extra keys become cleanup candidates and must not be deleted in this workflow.

## 4. Observability Target

```bash
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env production
```

Record only masked request metadata. Authorization, Cookie, Bearer values, token values, and personal data are forbidden in evidence.

## 5. Legacy Worker Disposition

Default: retain legacy Worker until the new Worker has stable route, secret, and observability confirmation. Deletion requires separate approval and rollback analysis.

## 6. Stop Conditions

- Any command requires direct `wrangler`.
- Any secret value would be displayed.
- A route still points to the wrong Worker and no approved migration plan exists.
- DNS mutation or production deploy is requested without separate approval.
