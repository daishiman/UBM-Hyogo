# Phase 8: DRY 化（命名・path・endpoint・table・branch ↔ env 正規化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | legacy-closeout |
| Mode | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

旧 UT-09 を direct implementation として参照している箇所と、legacy umbrella
としてのみ参照されるべき箇所の差分を洗い出し、命名 / 型 / path / endpoint /
table / branch ↔ env を canonical 表記に統一する。本タスクはコード重複では
なくドキュメント重複 / 表記揺れを対象とする。

## 実行タスク

1. Before / After 表（参照文脈の差分）作成
2. 正規化規則（path / endpoint / table / branch ↔ env）確定
3. 重複ドキュメント箇所の抽出と統合方針提示
4. 用語 audit（rg で揺れ検出 → 0 hit）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 正規化対象（path / endpoint / table / branch ↔ env） |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-05.md | runbook の擬似 diff（同 snippet を再利用） |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-07.md | AC matrix（用語整合の基準） |
| 参考 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/phase-08.md | 用語統一の隣接タスク |
| 参考 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-08.md | 用語統一の隣接タスク |

## 実行手順

### ステップ 1: Before / After 表の作成

下記「Before / After 表」に沿って path / endpoint / table / branch ↔ env /
用語 / 参照文脈を統一する。

### ステップ 2: 正規化規則の確定

下記「正規化規則」に沿って canonical 名を 1 件ずつ確定。

### ステップ 3: 重複ドキュメント箇所の抽出

下記「重複ドキュメント箇所と統合方針」にしたがい、Sheets API 前提 / 単一
endpoint / sync_audit を扱う重複記述の整理方針を確定。

### ステップ 4: 用語 audit

`rg` で揺れがないことを確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化結果を品質チェックに反映 |
| 上流 03a / 03b / 04c / 09b | 用語 / path / endpoint / table 統一 |
| Phase 7 AC matrix | DRY 化後も AC が崩れないことを再確認 |

## 多角的チェック観点（不変条件）

- **#1**: canonical 表現が Forms API 経路のみを参照していること（Sheets API
  前提を canonical に昇格させない）。
- **#5**: canonical 表現で D1 直接アクセスは apps/api 限定が明示されている。
- **#6**: GAS apps script trigger は canonical 化対象に含めない（legacy 文脈
  でのみ参照）。
- **#10**: cron 頻度の canonical 表記が 09b と一致。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before / After 表 | 8 | pending | 6 行以上 |
| 2 | 正規化規則 | 8 | pending | path / endpoint / table / branch ↔ env |
| 3 | 重複ドキュメント抽出 | 8 | pending | 統合方針 |
| 4 | 用語 audit | 8 | pending | rg で 0 hit |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| ドキュメント | outputs/phase-08/before-after.md | Before / After 詳細 |
| ドキュメント | outputs/phase-08/normalization-rules.md | 正規化規則 |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 完了条件

- [ ] Before / After 表完成
- [ ] 正規化規則（path / endpoint / table / branch ↔ env）が canonical 1 件ずつに確定
- [ ] 重複ドキュメント箇所と統合方針が文書化
- [ ] 用語 audit で stale 表記の hit が 0

## タスク100%実行確認【必須】

- 全実行タスク (1〜4) が completed
- before-after.md / normalization-rules.md が outputs/phase-08/ に配置
- artifacts.json の phase 8 を completed に更新

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項: 正規化規則 / 重複ドキュメント統合方針
- ブロック条件: 用語 audit に stale 表記が残っている場合は次 Phase に進まない

---

## Before / After 表

| 種別 | Before (stale) | After (canonical) | 根拠 | canonical reference path（specs 正本） |
| --- | --- | --- | --- | --- |
| path | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | レビュー指摘原文 §9 | - |
| endpoint | 単一 `/admin/sync` | `/admin/sync/schema` + `/admin/sync/responses` | 元仕様 §5 / 04c | docs/00-getting-started-manual/specs/03-data-fetching.md / specs/13-mvp-auth.md |
| table | `sync_audit` | `sync_jobs` | 02c / 03a / 03b 正本 | docs/00-getting-started-manual/specs/03-data-fetching.md |
| branch / env | `dev / main 環境` 単独表記 | `dev branch -> staging env` / `main branch -> production/top-level env` | 元仕様 Phase 1 §3 | - |
| sync API | `Google Sheets API v4` / `spreadsheets.values.get` | `Google Forms API` / `forms.get` / `forms.responses.list` | 元仕様 §1.1 | docs/00-getting-started-manual/specs/01-api-schema.md |
| 旧タスク id | `UT-09-sheets-d1-sync-job-implementation` | `task-sync-forms-d1-legacy-umbrella-001` | レビュー指摘原文 §9 | - |
| 旧責務記述 | 単一 UT-09 へ schema 取得 / response 取得 / cron / endpoint をすべて記述 | 03a (schema) / 03b (response) / 04c (endpoint) / 09b (cron) に分散参照 | 元仕様 §4 Phase 2 | docs/00-getting-started-manual/specs/00-overview.md |
| 参照文脈 | 旧 UT-09 を新規実装入口として参照 | 旧 UT-09 は legacy umbrella としてのみ参照（実装入口は 03a / 03b / 04c / 09b） | 元仕様 §9 | - |
| placeholder | "（後で埋める）" / "TBD" | `<placeholder>` で統一（09b と整合） | 09b phase-08 | - |
| WAL 表現 | `PRAGMA journal_mode=WAL` を前提とする記述 | 「WAL 非前提」「SQLITE_BUSY retry/backoff」「短 transaction」「batch-size 制限」 | 元仕様 §3.3 / Phase 6 FD-5 | docs/00-getting-started-manual/specs/08-free-database.md |
| consent キー | フォーム由来の任意名 | `publicConsent` / `rulesConsent` の 2 キーに統一（不変条件 #2） | CLAUDE.md / specs/01 | docs/00-getting-started-manual/specs/01-api-schema.md |
| current response | 旧 UT-09 では明示なし | `responseId` 単位の最新 1 件を current response として 03b で resolve | 元仕様 §3 | docs/00-getting-started-manual/specs/03-data-fetching.md |

## 正規化規則

| カテゴリ | canonical 名 | 利用箇所 |
| --- | --- | --- |
| legacy task path | `docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/` | 本タスクの phase-04〜08 ドキュメント / 元仕様の参照 |
| legacy task id | `task-sync-forms-d1-legacy-umbrella-001` | 全文書の id 表記 |
| schema sync endpoint | `POST /admin/sync/schema` | 04c index / 03a 設計 / 09b runbook |
| response sync endpoint | `POST /admin/sync/responses` | 04c index / 03b 設計 / 09b runbook |
| sync 監査 table | `sync_jobs` | 02c / 03a / 03b / 04c / 09b 全箇所 |
| branch ↔ env | `dev branch -> staging env` / `main branch -> production/top-level env` | 全タスクの環境説明 |
| sync API | Google Forms API (`forms.get` / `forms.responses.list`) | 03a / 03b / 09b |
| placeholder 表記 | `<placeholder>` | 全 runbook |

## 重複ドキュメント箇所と統合方針

| 重複箇所 | 統合方針 |
| --- | --- |
| 旧 UT-09 ファイルと本タスク (legacy umbrella) で同じ責務移管表が記述される可能性 | 移管表は元仕様 §4 Phase 2 を **唯一の正本**とし、本タスクの phase-05 / phase-07 / phase-08 では同表を引用する形に留め、再記述を避ける |
| Sheets API 前提への注意喚起が複数タスクに散在 | canonical 注意文を本タスク phase-08 に集約し、03a / 03b / 04c は本タスクへリンクする |
| `sync_jobs` 排他 (409 Conflict) の説明が 02c / 03a / 03b / 04c / 09b に重複 | 02c の sync_jobs repository spec を **唯一の正本**とし、他タスクからは 02c へ参照を張る |
| `dev / main 環境` 表記揺れが複数タスクに散在 | 本タスク phase-08 normalization-rules.md を **唯一の正本**とし、他タスクは同ファイルへリンク |
| WAL 非前提 / SQLITE_BUSY retry/backoff の文言が 03a / 03b / 09b に散在 | 元仕様 §3.3 を **唯一の正本**とし、03a / 03b / 09b は引用のみに揃える（Phase 5 quality-port Diff B/C/D で同一フォーマットに統一） |

## 用語 audit 結果（期待値）

```bash
# stale path / id
rg -niw "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
  docs/30-workflows/02-application-implementation
# expected: 0 hit（legacy umbrella 文脈以外）

# stale sync API
rg -n "Google Sheets API v4|spreadsheets\\.values\\.get" \
  docs/30-workflows/02-application-implementation
# expected: 0 hit

# stale endpoint / table
rg --pcre2 -n "/admin/sync(?!/)|sync_audit" \
  docs/30-workflows/02-application-implementation
# expected: 0 hit

# stale branch ↔ env
rg -n "dev / main 環境|dev/main 環境" \
  docs/30-workflows/02-application-implementation
# expected: 0 hit

# placeholder 揺れ
rg -niw "TBD|TODO|（後で埋める）" \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001
# expected: 0 hit（`<placeholder>` に統一済み）
```
