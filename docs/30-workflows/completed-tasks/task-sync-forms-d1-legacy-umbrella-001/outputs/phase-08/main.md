# Phase 08 成果物: DRY 化（命名 / path / endpoint / table / branch ↔ env 正規化）

## サマリ

旧 UT-09 を direct implementation として参照している箇所と、legacy umbrella としてのみ参照される箇所の差分を洗い出し、命名 / path / endpoint / table / branch ↔ env を canonical 表記に統一する。本タスクはコード重複ではなくドキュメント重複 / 表記揺れを対象とする。

## Before / After 表（参照文脈の差分）

| 観点 | Before（揺れ） | After（canonical） |
| --- | --- | --- |
| タスク ID | `UT-09` / `UT-09 sheets-d1-sync-job` / `ut-09-sheets-to-d1-cron-sync-job` | `task-sync-forms-d1-legacy-umbrella-001`（legacy umbrella 参照時のみ旧 ID 言及可） |
| ディレクトリ | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/`（新設禁止対象は前者） |
| 同期 API | `Google Sheets API v4` / `spreadsheets.values.get` | `Google Forms API` / `forms.get` / `forms.responses.list` |
| 手動 endpoint | `/admin/sync` | `POST /admin/sync/schema` / `POST /admin/sync/responses` |
| 監査テーブル | `sync_audit` | `sync_jobs` |
| 環境表記 | `dev / main 環境` / `dev/main 環境` | `dev branch -> staging env` / `main branch -> production env` |
| cron 実装 | `GAS apps script trigger` | `Workers Cron Triggers`（wrangler.toml `[triggers]`） |
| D1 競合対策 | `PRAGMA journal_mode=WAL` | retry/backoff（指数）+ 短い transaction + batch-size 制限 |
| job 排他 | アプリ内 mutex | `sync_jobs.status='running'` 行排他 + 二重時 409 Conflict |

## 正規化規則

| 種別 | ルール |
| --- | --- |
| path | 旧 ID `ut-09-sheets-to-d1-cron-sync-job/` は新設禁止。legacy umbrella 文脈で参照する場合は本タスク `task-sync-forms-d1-legacy-umbrella-001/` を経由 |
| endpoint | `/admin/sync/schema` と `/admin/sync/responses` を正本。単一 `/admin/sync` は禁止 |
| table | `sync_jobs` を正本。`sync_audit` は legacy 言及のみ |
| branch ↔ env | `dev` branch → `staging` env、`main` branch → `production` env を一意のフルテキストで記述 |
| 不変条件触れ方 | #1 / #5 / #6 / #7 / #10 を順序固定で言及 |
| 実フォーム値 | `formId=119ec539...` 等は CLAUDE.md の「フォーム固定値」表のみで保持、各タスク内で再記述しない |

## 重複ドキュメント箇所の抽出と統合方針

| 重複箇所 | 統合方針 |
| --- | --- |
| 責務移管表（旧 UT-09 / 本タスク Phase 02 / Phase 05 Diff A） | Phase 02 `responsibility-mapping.md` を single source、他ファイルは参照のみ |
| stale↔正本表（Phase 02 main.md / phase-04 / phase-05） | Phase 02 main.md を正本、phase-04/05 は ID 参照 |
| AC リスト（Phase 01 / 03 / 07） | Phase 01 main.md を正本、Phase 07 ac-matrix.md は trace 表のみ |
| 擬似 diff snippet（Phase 05 / 12） | Phase 05 main.md を正本、Phase 12 implementation-guide.md は要約と引用のみ |

## 用語 audit（揺れ検出 → 0 hit）

```bash
# 旧表記の揺れを検出
rg --pcre2 -n "Google Sheets API v4|spreadsheets\\.values\\.get|/admin/sync(?!/)|sync_audit|dev / main 環境|dev/main 環境" \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 \
  docs/30-workflows/02-application-implementation \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver

# 期待: 本タスク Phase 02 の stale↔正本表の対応行を除き 0 hit
```

## エビデンス / 参照

- `outputs/phase-02/main.md` / `responsibility-mapping.md`
- `outputs/phase-05/main.md`
- `outputs/phase-07/ac-matrix.md`
- 03a / 09b の phase-08.md（隣接タスクの用語統一）

## AC トレーサビリティ

| AC | DRY 化での扱い |
| --- | --- |
| AC-3 / AC-4 / AC-8 | canonical 表記の統一で担保 |
| AC-12 | 旧 path 新設禁止を正規化規則として明文化 |
| AC-13 | specs と矛盾する用語揺れを 0 hit に追い込む |

## 不変条件チェック

- #1: Sheets schema 固定の表記が canonical 規則に違反するため audit で検出
- #5: `apps/web から D1` 表現の検出も正規化規則で再確認
- #6: GAS apps script trigger を canonical 化対象外（許容しない）

## 次 Phase（09 品質保証）への引き渡し

1. canonical 表記表 / 正規化規則
2. 用語 audit コマンド（0 hit 期待）
3. 重複統合方針（Phase 12 ドキュメント更新で適用）
