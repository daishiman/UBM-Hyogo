# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-30 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（legacy umbrella close-out の表記揃え） |

## 目的

Phase 1〜7 で抽出した「UT-21 stale 前提 5 項目」「有効品質要件 4 種の移植先」「`POST /admin/sync` 新設禁止方針」が、`index.md` / `phase-01.md` 〜 `phase-07.md` / `unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` 原典 / `unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` legacy / 後続 U02 / U04 / U05 ファイルにわたって、**用語ぶれなく単一表で参照可能**な状態にすることがゴール。具体的には「同期元」「endpoint」「audit table」「実装パス」「job ledger」の 5 軸で表記を統一表に集約し、Sheets vs Forms / single endpoint vs split / `sync_audit_logs` vs `sync_jobs` の三大ぶれを一意化する。本タスクは docs-only であり、コード（`apps/api/src/jobs/*` / `apps/api/src/sync/schema/*`）への変更は含まない。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs / index.md / artifacts.json / 原典 / legacy / 後続 3 ファイルを横断 grep し、Sheets / Forms / endpoint / audit table / 実装パスに関する表記揺れを洗い出す（完了条件: 揺れ件数が表化されている）。
2. SSOT を確定する。本タスクの正本は `index.md` 「主要な参照資料」表 + 本 Phase の「正本用語表」とし、現行コード正本は `apps/api/src/jobs/sync-forms-responses.ts` と `apps/api/src/sync/schema/*`、aiworkflow-requirements 正本は `.claude/skills/aiworkflow-requirements/references/task-workflow.md` に固定する（完了条件: SSOT 表が 5 軸で完成）。
3. 用語ぶれ（Sheets API v4 / `spreadsheets.values.get` / `SheetRow` / 単一 `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` / `apps/api/src/sync/{core,manual,scheduled,audit}.ts`）を抽出し、After 表記に統一する（完了条件: Before/After 表で揺れ件数 0）。
4. 「endpoint は split」「audit ledger は `sync_jobs` 単一」「同期元は Forms API」を全 phase / outputs に同一フレーズで埋め込む方針を記述する（完了条件: 埋め込みフレーズが Phase 12 system-spec-update-summary.md の対象として列挙される）。
5. navigation drift（artifacts.json `phases[*].primaryArtifact` × 各 phase-XX.md × index.md `Phase 一覧` × 実 path）が 0 であることを確認する（完了条件: drift 0）。
6. legacy umbrella close-out として共通化できる「再発防止フレーズ」（旧仕様タスクは direct implementation せず、現行正本との差分表を Phase 12 で出力する）を、`task-sync-forms-d1-legacy-umbrella-001` と本タスクで共有テンプレ化する候補として列挙する（完了条件: 共通化候補が 3 件以上、転用可否付き）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/index.md | 用語・命名の正本 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md | 原典 close-out spec |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 legacy 仕様（用語ぶれの源） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out（共通テンプレ抽出元） |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | 後続 U02 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md | 後続 U04 |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md | 後続 U05 |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | D1 / sync_jobs / deployment current facts |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | Forms response sync 正本実装 |
| 必須 | apps/api/src/sync/schema/ | schema 同期正本実装 |

## 正本用語表（SSOT 5 軸）

| 軸 | 旧表記（UT-21 legacy 由来） | After（SSOT） | 正本ソース |
| --- | --- | --- | --- |
| 同期元 | Google Sheets API v4 / `spreadsheets.values.get` / `SheetRow` | Google Forms API (`forms.get` / `forms.responses.list`) / Forms `responseId` ベース DTO | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/` |
| admin endpoint | 単一 `POST /admin/sync`（job_kind を body で分岐） | split: `POST /admin/sync/schema` + `POST /admin/sync/responses`（job_kind 単一責務） | 04c-parallel-admin-backoffice-api-endpoints |
| audit / 公開 endpoint | `GET /admin/sync/audit`（公開 read API） | 公開 endpoint なし。`sync_jobs` ledger を admin UI 経由で参照 | `task-workflow.md` current facts |
| audit table | `sync_audit_logs` + `sync_audit_outbox`（二段監査） | `sync_jobs` ledger 単一（`status` / `job_kind` / `metrics_json` / `started_at` / `finished_at`）。新設は U02 判定後まで保留 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary |
| 実装パス | `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 一式 | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` | repo 実体 |

## Before / After 比較テーブル

### 同期元 / DTO

| 対象 | Before（drift） | After（SSOT） | 理由 |
| --- | --- | --- | --- |
| 同期元 API | `spreadsheets.values.get` | `forms.get` / `forms.responses.list` | 03a / 03b の正本 |
| DTO 名称 | `SheetRow` / 列インデックスベース | Forms response / `responseId` ベース | 不変条件 #1 と整合 |
| 冪等キー算出根拠 | 列インデックス + 行番号 | `SHA-256(responseId)` | 03b 正本 |

### endpoint 表記

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| sync 起動 endpoint | `POST /admin/sync` 単一 | `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 系統 | job_kind 単一責務原則（04c） |
| 監査参照 endpoint | `GET /admin/sync/audit` 公開 | 公開しない（admin UI 経由で `sync_jobs` を参照） | `task-workflow.md` current facts |
| Bearer guard 適用範囲 | `/admin/sync` 単一 | `/admin/sync/schema` / `/admin/sync/responses` 双方 | 04c |

### audit ledger / table

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 監査台帳 | `sync_audit_logs`（実行ログ） | `sync_jobs.status` / `metrics_json` / `started_at` / `finished_at` | 02c 正本 |
| 失敗詳細保管 | `sync_audit_outbox`（再送 outbox） | `sync_jobs.metrics_json` または失敗時 retry job として再投入 | 03a / 03b retry 規約 |
| 二段監査の必要性判定 | UT-21 で即新設前提 | U02 で「`sync_jobs` 不足分析」を行ってから判断 | 過剰実装防止 |

### 実装パス

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Cron handler 配置 | `apps/api/src/sync/scheduled.ts` | 既存 Cron handler + `apps/api/src/jobs/sync-forms-responses.ts` を呼び出し | 09b 正本 |
| 手動起動 entry | `apps/api/src/sync/manual.ts` | `apps/api/src/jobs/sync-forms-responses.ts`（job_kind で分岐） | 03b 正本 |
| schema 同期 entry | `apps/api/src/sync/core.ts` | `apps/api/src/sync/schema/` 配下 | 03a 正本 |
| audit | `apps/api/src/sync/audit.ts` | 専用ファイルなし。`sync_jobs` repo（02c）を介する | 02c 正本 |

## 共通化テンプレ抽出候補（legacy umbrella DRY）

| # | 共通化候補 | 抽出先 | 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 「旧仕様タスクは direct implementation せず legacy umbrella として閉じる」判定フレーズ | `.claude/skills/task-specification-creator/references/legacy-umbrella-pattern.md`（新規・本タスクではメモのみ） | 可（`task-sync-forms-d1-legacy-umbrella-001` と本タスクで再利用） | skill-feedback で正本化提案 |
| 2 | 「現行正本との差分表」テンプレ（同期元 / endpoint / audit / 実装パス / job ledger の 5 軸） | 上記 | 可 | 本 Phase の SSOT 5 軸表をテンプレ化 |
| 3 | 「`sync_jobs` ledger を admin-managed として再確認する」フレーズ | 02c 正本へ参照リンク | 可（sync 系 close-out 全般） | 不変条件 #4 と紐付け |
| 4 | 「不変条件 #5: D1 直接アクセスは `apps/api` に閉じる」確認チェック項目 | 全 close-out テンプレ共通 | 可 | Phase 9 / 10 で再利用 |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].primaryArtifact` と各 phase-XX.md の `outputs/phase-XX/...` 参照 | `rg -n "outputs/phase-" docs/30-workflows/ut21-forms-sync-conflict-closeout` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | `ls docs/30-workflows/ut21-forms-sync-conflict-closeout/phase-*.md` | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の `../unassigned-task/*.md` 相対参照 | 全件 ls 確認 | リンク切れ 0 |
| 後続 U02 / U04 / U05 の実在 | `ls docs/30-workflows/unassigned-task/task-ut21-*.md` | 3 ファイル実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/234` | 200 OK / CLOSED |
| 正本コードパス | `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/` | 実在 |

## 共通化パターン

- 用語: Sheets / Forms 混在禁止。Forms 起源を SSOT、Sheets 表記は legacy 引用文脈でのみ「旧 UT-21 表記」と注記して残す。
- endpoint: 「split」を強調する文では必ず `POST /admin/sync/schema` + `POST /admin/sync/responses` を併記する。
- audit: 「`sync_jobs` ledger を正本」と「`sync_audit_logs/outbox` は新設しない（U02 判定後まで保留）」をセットで記述する。
- 4条件: 「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- AC ID: `AC-1`〜`AC-11` のハイフン区切りで統一。
- 不変条件は #1 / #4 / #5 / #7 のみ touched（index.md と整合）。

## 削除対象一覧

- 旧仕様タスクの「Sheets API v4 を直接実装する」記述は本タスク内の文脈では出さない（legacy ファイル本体は触らない）。
- 「`POST /admin/sync` を新設する」「`GET /admin/sync/audit` を公開する」表記は本タスク全 phase / outputs から排除（引用文脈以外）。
- `apps/api/src/sync/{core,manual,scheduled,audit}.ts` というパス表記は U05 後続タスクへの委譲注記としてのみ残す。
- `sync_audit_logs` / `sync_audit_outbox` の積極導入を示唆する表現は U02 判定前まで全削除。

## 実行手順

### ステップ 1: 用語ぶれの洗い出し
- `rg -n "spreadsheets\.values\.get|SheetRow|POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox|apps/api/src/sync/(core|manual|scheduled|audit)\.ts" docs/30-workflows/ut21-forms-sync-conflict-closeout` を実行。
- 検出箇所を表化。

### ステップ 2: SSOT 5 軸表の作成
- 「同期元 / endpoint / audit table / 実装パス / job ledger」の 5 軸で正本用語を確定。

### ステップ 3: Before / After 4 区分の作成
- 同期元 / endpoint / audit ledger / 実装パスの 4 区分で揺れを統一。

### ステップ 4: 共通化テンプレ候補の特定
- `task-sync-forms-d1-legacy-umbrella-001` との共通要素を 3 件以上列挙し、skill-feedback への提案候補化。

### ステップ 5: navigation drift 確認
- artifacts.json と各 phase-XX.md / index.md / 後続 U02・U04・U05 の path を照合。
- リンク切れ 0 を確認。

### ステップ 6: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | SSOT 用語表を品質保証チェックリストの前提として使用 |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO の根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に SSOT 用語表を反映、skill-feedback に共通化テンプレ提案を記載 |
| 後続 U02 | `sync_jobs` 不足分析の前提語彙を引き渡し |
| 後続 U05 | 実装パス境界整理の前提語彙を引き渡し |

## 多角的チェック観点

- 価値性: SSOT 化で UT-21 二重正本リスクが消え、03a / 03b / 04c / 09b の受入条件 patch 案が用語ぶれなく記述可能。
- 実現性: docs-only 範囲内で集約方針を確定でき、コード変更（apps/api/src/sync/* 削除等）は U05 へ委譲済み。
- 整合性: 不変条件 #1 / #4 / #5 / #7 が SSOT に明文化される。
- 運用性: legacy umbrella 共通テンプレ 4 件抽出により、次回同種タスク（旧仕様 vs 現行正本）の判定コストが下がる。
- 認可境界: Bearer guard 適用範囲が split 表記に統一され、04c 受入条件 patch 案と整合。
- 無料枠: docs-only のため CI 実行コストへの影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 用語ぶれ洗い出し | 8 | spec_created | rg で網羅 |
| 2 | SSOT 5 軸用語表確定 | 8 | spec_created | 同期元 / endpoint / audit / impl path / job ledger |
| 3 | Before / After 4 区分 | 8 | spec_created | 同期元 / endpoint / audit / 実装パス |
| 4 | 共通化テンプレ候補 3 件以上 | 8 | spec_created | skill-feedback 提案候補 |
| 5 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（SSOT 5 軸 / Before/After / 共通化候補 / navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] SSOT 5 軸表（同期元 / endpoint / audit table / 実装パス / job ledger）が空セルなしで完成
- [ ] Before / After 比較テーブルが 4 区分（同期元 / endpoint / audit / 実装パス）で空セルなし
- [ ] 共通化テンプレ候補が 3 件以上、転用可否付きで列挙
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path / 後続 U02・U04・U05）が 0
- [ ] 「`POST /admin/sync` / `GET /admin/sync/audit` を新設しない」「`sync_audit_logs/outbox` 新設は U02 判定後保留」が SSOT 表に明記
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- SSOT 5 軸網羅
- Before / After 4 区分網羅
- 共通化候補 3 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 5 軸用語表（Phase 9 監査の照合基準として使用）
  - 共通化テンプレ候補（Phase 12 skill-feedback で正本化提案）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - SSOT 表に空セルが残る
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - `sync_audit_logs/outbox` の新設方針が U02 保留と矛盾する記述が残る
