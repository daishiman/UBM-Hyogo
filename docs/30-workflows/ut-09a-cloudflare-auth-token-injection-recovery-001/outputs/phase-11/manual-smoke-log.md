# Manual Smoke Log

Status: `RUNTIME_EVIDENCE_CAPTURED`.

実行日: 2026-05-04

| command / check | expected | actual | status |
| --- | --- | --- | --- |
| `bash scripts/cf.sh whoami` | exit 0 + Cloudflare account identity | exit 0。identity は `whoami-account-identity.log` に redacted 形式で保存 | PASS |
| `outputs/phase-11/redaction-checklist.md` | secret / vault / item / `.env` 値の非露出 | token 値、OAuth token、実 vault 名、実 item 名、`.env` 値、email 実値なし | PASS |
| `outputs/phase-11/stage-isolation.md` | op -> mise -> wrangler の到達確認 | 全段到達。`scripts/cf.sh` / `scripts/with-env.sh` drift なし | PASS |
| `outputs/phase-11/wrangler-login-residue.md` | OAuth residue なし | 残置なし。除去不要 | PASS |
| `outputs/phase-11/handoff-to-parent.md` | 親タスクが参照可能な evidence path | `ut-09a-exec-staging-smoke-001` の Cloudflare 認証 blocker は unblock ready | PASS |

本実行では token 再発行、`wrangler login` 採用、OAuth residue 除去、commit / push / PR は行っていない。
