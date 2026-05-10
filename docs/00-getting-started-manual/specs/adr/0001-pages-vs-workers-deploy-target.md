# ADR-0001: apps/web deploy target (Cloudflare Pages vs Workers)

## Status

Accepted (2026-05-01)

Update (2026-05-09): repo-side `.github/workflows/web-cd.yml` cutover was implemented by Issue #331. Remaining work is Cloudflare side retirement / route verification / runtime smoke under user approval.

## Context

`apps/web` の Cloudflare deploy topology は 4 つの参照点に分散し、2026-05-01 時点で drift が残っていた。

| 参照点 | 2026-05-01 時点の状態 | 形式 |
| --- | --- | --- |
| `CLAUDE.md` | `Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers |
| `apps/web/wrangler.toml` | `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` | Workers |
| `.github/workflows/web-cd.yml` | `command: pages deploy .next --project-name=...` | Pages |
| `deployment-cloudflare.md` | 2026-04-29 current facts として Pages 形式を記載 | Stale |

本 ADR は、`CLAUDE.md` と `apps/web/wrangler.toml` の Workers 方針を deploy target の正本として採用し、残る `.github/workflows/web-cd.yml` / Cloudflare side の切替を後続 migration task へ委譲する。

2026-05-09 時点では、Issue #331 により `.github/workflows/web-cd.yml` も OpenNext Workers build + `scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>` に同期済み。上表は ADR 採択時点の履歴である。

GitHub Issue #287 に対応する。Refs #287。

## Decision

`apps/web` の deploy target は **Cloudflare Workers + `@opennextjs/cloudflare`** に統一する。

実 cutover は本 ADR では実施しない。残作業は `task-impl-opennext-workers-migration-001` で扱う。

| 対象 | 決定 |
| --- | --- |
| `apps/web/wrangler.toml` | Workers 形式を維持する |
| `.github/workflows/web-cd.yml` | Issue #331 で `pages deploy` から Workers deploy へ置換済み |
| Cloudflare side | Pages project retirement / route verification / runtime smoke を user-gated AC として残す |
| `CLAUDE.md` | Workers 表記を維持する |
| 正本仕様 | current facts を `wrangler.toml = Workers / web-cd.yml = Workers deploy` に更新済み |

## Consequences

- ADR 採択と runtime cutover 完了は別物として扱う。
- `.github/workflows/web-cd.yml` の `pages deploy` 置換は Issue #331 で consumed。staging / production smoke、Cloudflare side retirement / route verification は user approval 後に扱う。
- Workers 形式 cutover 後も `apps/web/wrangler.toml` への `[[d1_databases]]` 追加は禁止する。D1 binding は `apps/api` 側のみに閉じる。
- `@opennextjs/cloudflare` の major update 時は互換性を再評価する。

## Alternatives Considered

| 案 | 採否 | 理由 |
| --- | --- | --- |
| Workers cutover | Accepted | `apps/web/wrangler.toml` と `CLAUDE.md` が既に Workers 方針で整合しているため |
| Pages 維持 | Rejected | `wrangler.toml` の Pages rollback と `CLAUDE.md` の方針修正が必要で、drift 解消コストが高い |
| dev Workers / production Pages | Rejected | 二重 runtime の維持コストが高く、現在の drift を温存するため |

## Related

| 種別 | パス |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` |
| migration task | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` |
| system spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| OpenNext Workers spec | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |
