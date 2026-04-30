# Phase 8 Output: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 8 / 13（DRY 化 / リファクタリング） |
| taskType | docs-only / specification-cleanup |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 作成日 | 2026-04-30 |

## 1. 目的

Phase 1〜7 で抽出した「UT-21 stale 前提 5 項目」「有効品質要件 4 種の移植先」「`POST /admin/sync` 新設禁止方針」が、`index.md` / `phase-01.md` 〜 `phase-07.md` / `unassigned-task/` 配下原典 / 後続 U02・U04・U05 ファイルにわたって、**用語ぶれなく単一表で参照可能**な状態を確定する。本タスクは docs-only であり、`apps/api/src/jobs/sync-forms-responses.ts` および `apps/api/src/sync/schema/*` などコードへの変更は含まない。

## 2. 用語ぶれ洗い出し（ステップ 1）

### 検出コマンド

```bash
rg -n "spreadsheets\.values\.get|SheetRow|POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox|apps/api/src/sync/(core|manual|scheduled|audit)\.ts" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout
```

### 検出結果サマリー（2026-04-30）

| 用語パターン | ヒット文脈 | 残置可否 | 備考 |
| --- | --- | --- | --- |
| `spreadsheets.values.get` | Phase 1 §5 stale 前提表 / Phase 2 migration-matrix / Phase 8 SSOT 表 / 本 main.md Before 列 | 引用文脈のみ残置 | UT-21 legacy 由来の Before 表記 |
| `SheetRow` | Phase 1 / Phase 2 / Phase 8 SSOT 表 | 引用文脈のみ残置 | DTO 名称 Before |
| `POST /admin/sync\b`（単一） | Phase 2 no-new-endpoint-policy.md / Phase 8 SSOT 表 / 本 main.md / index.md AC-3 | 引用文脈のみ残置 | 「新設しない」明文化が目的 |
| `GET /admin/sync/audit` | 同上 | 引用文脈のみ残置 | 公開 endpoint 新設拒否の対象 |
| `sync_audit_logs` / `sync_audit_outbox` | Phase 1〜8 / index.md AC-4 / U02 委譲ノート | 引用文脈のみ残置 | U02 判定後保留 |
| `apps/api/src/sync/{core,manual,scheduled,audit}.ts` | Phase 1 §5 / Phase 2 / Phase 8 SSOT 表 / U05 委譲ノート | 引用文脈のみ残置 | U05 で境界整理委譲 |

**揺れ件数**: 推奨表記としての出現は 0、引用文脈（Before 表 / 「新設しない」明文化 / U02・U05 委譲ノート）のみ残置。Phase 9 rg 検証で再確認する。

## 3. SSOT（Single Source of Truth）5 軸（ステップ 2）

| 軸 | Before（UT-21 legacy 由来） | After（SSOT 採用） | 正本ソース |
| --- | --- | --- | --- |
| 同期元 | Google Sheets API v4 / `spreadsheets.values.get` / `SheetRow` | Google Forms API（`forms.get` / `forms.responses.list`）/ Forms `responseId` ベース DTO | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/` |
| admin endpoint | 単一 `POST /admin/sync`（job_kind を body 分岐） | split: `POST /admin/sync/schema`（03a） + `POST /admin/sync/responses`（03b）| 04c-parallel-admin-backoffice-api-endpoints / 03a / 03b |
| audit / 公開 endpoint | `GET /admin/sync/audit`（公開 read API） | 公開 endpoint なし。`sync_jobs` ledger を admin UI 経由で参照 | `task-workflow.md` current facts |
| audit table | `sync_audit_logs` + `sync_audit_outbox`（二段監査） | `sync_jobs` ledger 単一（`status` / `job_kind` / `metrics_json` / `started_at` / `finished_at`）。新設は U02 判定後まで保留 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary |
| 実装パス | `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 一式 | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | repo 実体（Phase 9 で再確認） |

> SSOT 表に空セルなし。5 軸すべてで Before / After / 正本ソースが一意。

## 4. Before / After 4 区分比較（ステップ 3）

### 4.1 同期元 / DTO

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 同期元 API | `spreadsheets.values.get` | `forms.get` / `forms.responses.list` | 03a / 03b 正本 |
| DTO 名称 | `SheetRow`（列インデックスベース） | Forms response（`responseId` ベース） | 不変条件 #1 と整合 |
| 冪等キー算出根拠 | 列インデックス + 行番号 | `SHA-256(responseId)` | 03b 正本 |

### 4.2 endpoint 表記

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| sync 起動 endpoint | `POST /admin/sync` 単一 | `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 系統 | job_kind 単一責務原則（04c） |
| 監査参照 endpoint | `GET /admin/sync/audit` 公開 | 公開しない（admin UI 経由で `sync_jobs` 参照） | `task-workflow.md` current facts |
| Bearer guard 適用範囲 | `/admin/sync` 単一 | `/admin/sync/schema` / `/admin/sync/responses` 双方 | 04c |

### 4.3 audit ledger / table

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 監査台帳 | `sync_audit_logs`（実行ログ） | `sync_jobs.status` / `metrics_json` / `started_at` / `finished_at` | 02c 正本 |
| 失敗詳細保管 | `sync_audit_outbox`（再送 outbox） | `sync_jobs.metrics_json` または失敗時 retry job として再投入 | 03a / 03b retry 規約 |
| 二段監査の必要性判定 | UT-21 で即新設前提 | U02 で `sync_jobs` 不足分析を行ってから判断 | 過剰実装防止 |

### 4.4 実装パス

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Cron handler 配置 | `apps/api/src/sync/scheduled.ts` | 既存 Cron handler + `apps/api/src/jobs/sync-forms-responses.ts` を呼び出し | 09b 正本 |
| 手動起動 entry | `apps/api/src/sync/manual.ts` | `apps/api/src/jobs/sync-forms-responses.ts`（job_kind で分岐） | 03b 正本 |
| schema 同期 entry | `apps/api/src/sync/core.ts` | `apps/api/src/sync/schema/` 配下 | 03a 正本 |
| audit 専用ファイル | `apps/api/src/sync/audit.ts` | 専用ファイルなし。`sync_jobs` repo（02c）を介する | 02c 正本 |

> 4 区分すべてで空セルなし。Before の積極使用は禁止し、引用文脈のみ残置（§7 削除対象一覧参照）。

## 5. 共通フレーズ埋め込み方針（ステップ 4）

以下 3 フレーズを Phase 全体・後続派生タスクで一字一句揃えて使用する。Phase 12 `system-spec-update-summary.md` に列挙し、レビュー時の検索基準とする。

| # | 共通フレーズ | 使用文脈 |
| --- | --- | --- |
| F-1 | 「endpoint は split: `POST /admin/sync/schema` + `POST /admin/sync/responses`（job_kind 単一責務）」 | endpoint を語る全文脈 |
| F-2 | 「audit ledger は `sync_jobs` 単一。`sync_audit_logs/outbox` は U02 判定後まで保留」 | audit を語る全文脈 |
| F-3 | 「同期元は Google Forms API（`forms.get` / `forms.responses.list`）。Sheets 系表記は legacy 引用のみ」 | 同期元を語る全文脈 |

## 6. 共通化テンプレ抽出候補（ステップ 4 後段・legacy umbrella DRY）

| # | 共通化候補 | 抽出先（提案） | 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 「旧仕様タスクは direct implementation せず legacy umbrella として閉じる」判定フレーズ | `.claude/skills/task-specification-creator/references/legacy-umbrella-pattern.md`（新規・本タスクではメモのみ・skill 改修は別タスク） | 可（`task-sync-forms-d1-legacy-umbrella-001` と本タスクで再利用済） | Phase 12 skill-feedback-report.md に提案 |
| 2 | 「現行正本との差分表」テンプレ（同期元 / endpoint / audit / 実装パス / job ledger の 5 軸） | 同上 | 可 | 本 Phase の SSOT 5 軸表をテンプレ化 |
| 3 | 「`sync_jobs` ledger を admin-managed として再確認」フレーズ | 02c 正本へ参照リンク | 可（sync 系 close-out 全般） | 不変条件 #4 と紐付け |
| 4 | 「不変条件 #5: D1 直接アクセスは `apps/api` に閉じる」確認チェック項目 | 全 close-out テンプレ共通 | 可 | Phase 9 / Phase 10 で再利用 |

> 共通化候補 4 件（要件 3 件以上を充足）。Phase 12 skill-feedback として提案するが、本タスク内では skill 配下を編集しない（mirror parity 保護）。

## 7. 削除対象一覧（推奨表記としての排除）

- 「Sheets API v4 を直接実装する」記述は本タスク全 phase / outputs の **推奨文脈**から排除（legacy ファイル本体 `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` には触らない）。
- 「`POST /admin/sync` を新設する」「`GET /admin/sync/audit` を公開する」表記は本タスク全 phase / outputs から排除（「新設しない方針の明文化」「Before 表」「U02 委譲ノート」など引用文脈以外）。
- `apps/api/src/sync/{core,manual,scheduled,audit}.ts` というパス表記は U05 後続タスクへの委譲注記としてのみ残す。
- `sync_audit_logs` / `sync_audit_outbox` の積極導入を示唆する表現は U02 判定前まで全削除。

## 8. navigation drift 確認（ステップ 5）

| チェック項目 | 確認方法 | 期待 | 結果 |
| --- | --- | --- | --- |
| artifacts.json `phases[*].primaryArtifact` × 各 phase-XX.md `outputs/phase-XX/...` 参照 | `rg -n "outputs/phase-" docs/30-workflows/ut21-forms-sync-conflict-closeout` | 完全一致 | 一致（spec_created 段階） |
| index.md `Phase 一覧` 表の file 列 × 実ファイル | `ls docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-*.md` | 13 ファイル一致 | 一致（phase-01〜phase-13） |
| index.md `主要成果物` 表のパス | artifacts.json と突合 | 完全一致 | 一致 |
| phase-XX.md 内 `../unassigned-task/*.md` 相対参照 | 全件 ls | リンク切れ 0 | 0 |
| 後続 U02 / U04 / U05 の実在 | `ls docs/30-workflows/unassigned-task/task-ut21-{sync-audit-tables-necessity-judgement,phase11-smoke-rerun-real-env,impl-path-boundary-realignment}-001.md` | 3 ファイル実在 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 実在 | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/234` | 200 OK / CLOSED | CLOSED 維持 |
| 正本コードパス | `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/` | 実在 | 実在 |

> navigation drift = 0。Phase 9 cross-link 死活確認で再検証する。

## 9. 共通化パターン（運用ルール）

- **用語**: Sheets / Forms 混在禁止。Forms 起源を SSOT、Sheets 表記は legacy 引用文脈でのみ「旧 UT-21 表記」と注記して残す。
- **endpoint**: split を強調する文では必ず `POST /admin/sync/schema` + `POST /admin/sync/responses` を併記する。
- **audit**: 「`sync_jobs` ledger を正本」と「`sync_audit_logs/outbox` は新設しない（U02 判定後まで保留）」をセットで記述する。
- **4条件**: 「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- **AC ID**: `AC-1`〜`AC-11` のハイフン区切りで統一。
- **不変条件**: #1 / #4 / #5 / #7 のみ touched（index.md と整合）。

## 10. 次 Phase への引き渡し

- SSOT 5 軸表（Phase 9 監査の照合基準）
- Before / After 4 区分（Phase 9 rg 検証で再確認）
- 共通フレーズ F-1 / F-2 / F-3（Phase 12 system-spec-update-summary.md に列挙予定）
- 共通化テンプレ候補 4 件（Phase 12 skill-feedback-report.md に提案）
- navigation drift 0 状態（Phase 9 cross-link 死活確認で再検証）

## 11. 完了条件チェック

- [x] SSOT 5 軸表が空セルなしで完成（§3）
- [x] Before / After が 4 区分で空セルなし（§4）
- [x] 共通化テンプレ候補が 3 件以上、転用可否付き（§6 で 4 件）
- [x] navigation drift 0（§8）
- [x] 「`POST /admin/sync` / `GET /admin/sync/audit` を新設しない」「`sync_audit_logs/outbox` 新設は U02 判定後保留」が SSOT 表に明記（§3 / §4.2 / §4.3）
- [x] outputs/phase-08/main.md 作成済み（本ファイル）
