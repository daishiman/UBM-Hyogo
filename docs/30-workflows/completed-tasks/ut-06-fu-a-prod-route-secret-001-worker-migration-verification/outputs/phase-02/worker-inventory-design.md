# Worker Inventory Design

## Purpose

Identify whether Cloudflare has both the legacy Worker and the new production Worker, and record which entity owns production traffic.

## Table Template

| Worker name | Expected role | Exists | Routes attached | Disposition |
| --- | --- | --- | --- | --- |
| `ubm-hyogo-web-production` | new production Worker | TBD at approved verification time | TBD | target |
| legacy name from UT-06-FU-A | rollback candidate | TBD at approved verification time | TBD | retain until new Worker is stable |

## Evidence Rules

- Record Worker names only.
- Do not record account IDs, token values, or unmasked zone IDs.
- Any deletion, disablement, or route migration requires separate user approval.
