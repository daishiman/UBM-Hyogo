# Route / Secret / Observability Design

## Route And Custom Domain

| Check | Expected result | Evidence |
| --- | --- | --- |
| Route target | production route points to `ubm-hyogo-web-production` | route pattern + Worker name table |
| Custom domain target | custom domain resolves through the intended Worker | domain label + Worker name table |
| Legacy target | no production route remains on legacy Worker unless documented as rollback route | exception record |

## Secret Keys

| Check | Expected result | Evidence |
| --- | --- | --- |
| Key parity | expected production keys equal Worker secret list | key names only |
| Missing key | listed as blocker before deploy | key name + source |
| Extra key | listed as cleanup candidate | key name only |

Secret values must never be displayed, copied, or written to this workflow.

## Observability

| Check | Expected result | Evidence |
| --- | --- | --- |
| Tail target | tail command points to production env of `apps/web/wrangler.toml` | command line + masked sample format |
| Logpush | dataset binding references intended Worker | target name only |
| Analytics | metrics view is scoped to intended Worker | target name only |
