# Phase 5 / main.md — セットアップ実行 サマリ

## 概要

D1 schema migration、`wrangler.toml` の binding、`GOOGLE_SERVICE_ACCOUNT_JSON` の Cloudflare Secrets 登録、sync worker 配置（`apps/api/src/sync/`）を runbook 化した。実装ファイル一覧を以下に明示する。

## 実装ファイル一覧（新規 / 修正）

### 新規

| パス | 用途 |
| --- | --- |
| `apps/api/migrations/0001_init.sql` | member_responses / member_identities / member_status / sync_audit |
| `apps/api/src/sync/client.ts` | Sheets API fetch クライアント |
| `apps/api/src/sync/mapping.ts` | Sheets row → D1 row 変換、consent 正規化 |
| `apps/api/src/sync/runner.ts` | manual / scheduled / backfill エントリ |
| `apps/api/src/sync/audit.ts` | sync_audit append |
| `apps/api/src/routes/admin/sync.ts` | manual trigger 用 admin endpoint |

### 修正

| パス | 内容 |
| --- | --- |
| `apps/api/wrangler.toml` | `[[d1_databases]]` (staging/production), `[triggers].crons`, `[vars]` |
| `apps/api/src/index.ts` | route 登録 + `scheduled` handler export |

不変条件 5 遵守: 上記すべて `apps/api` 配下。`apps/web` には D1 / Sheets アクセスを持ち込まない。

## 完了条件チェック

- [x] migration SQL が consent / responseEmail / admin 分離を含む
- [x] wrangler.toml binding が staging / prod 両方で定義済み（runbook 記載）
- [x] GOOGLE_SERVICE_ACCOUNT_JSON 登録手順が runbook に記載
- [x] sync worker が apps/api 配下に配置されている（apps/web には存在しない）
- [x] 実装ファイル一覧（新規/修正）が main.md に明示
- [x] rollback 手順が d1-bootstrap-runbook.md に含まれる

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | runbook をコピペで staging 完走可能 |
| 実現性 | OK | D1 / Workers cron 無料枠内 |
| 整合性 | OK | 不変条件 2/3/4/5/6/7 を満たす |
| 運用性 | OK | rollback（dump-restore + Sheets 再 backfill）整備済み |

## blocker / handoff

- blocker: なし
- 引き継ぎ: 配置済み worker / D1 schema を Phase 6 の異常系シナリオで突く
- ブロック条件解除: 実装ファイル一覧と 2 つの runbook が整備済み

## 成果物

- `outputs/phase-05/d1-bootstrap-runbook.md`
- `outputs/phase-05/sync-deployment-runbook.md`
