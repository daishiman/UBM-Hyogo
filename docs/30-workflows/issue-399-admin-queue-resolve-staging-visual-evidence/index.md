# issue-399-admin-queue-resolve-staging-visual-evidence

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | issue-399 |
| mode | serial |
| owner | - |
| 作成日 | 2026-05-03 |
| 改訂日 | 2026-05-03 |
| 状態 | implementation-prepared / implementation / VISUAL_ON_EXECUTION |
| visualEvidence | VISUAL_ON_EXECUTION |
| taskType | implementation |
| workflow_state | implementation-prepared |
| GitHub Issue | #399（CLOSED 状態のまま扱う。reopen / commit / push / PR は user 承認後） |

## 実装区分

`[実装区分: 実装仕様書]`

本タスクは **コード実装（fixture seed / smoke script / docs link 反映）を伴う実装仕様書**。
ユーザー指示は「タスク仕様書作成」だが、本タスクの目的（staging で `/admin/requests` の実 screenshot を取得し phase-12 implementation-guide の visual evidence ギャップを閉じる）は、以下のコード変更なしには達成不可能である:

- staging 専用の reversible D1 seed SQL（`apps/api/migrations/seed/` 配下）
- staging seed 投入 / 撤去スクリプト（`scripts/staging/`）
- screenshot 取得手順を記述した runbook + Playwright assist script（任意）
- 親 workflow `04b-followup-004-admin-queue-resolve-workflow/outputs/phase-12/implementation-guide.md` への evidence link 追記

そのため CONST_004 に従い「実装仕様書」として作成する。本仕様書は **コード実装手順（変更ファイル・関数シグネチャ・テスト・実行コマンド・DoD）** を記述するが、**コード実装の実行・commit・push・PR・staging への seed 投入・実 screenshot 取得は本仕様書の責務外**であり、user 承認付き staging runtime cycle（03.実装.md）で行う。

## purpose

GitHub Issue #399 の AC を満たすために、以下を一括で実装可能な状態にする:

1. `/admin/requests` の Pending visibility / delete list, detail panel, approve / reject confirm modal, empty state, 409 already-resolved toast を staging で実 screenshot 取得できる **fixture / runbook / 取得手順** を整備する
2. screenshot 取得結果を保存する evidence directory（`docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/screenshots/`）の contract を確定する
3. 親 workflow `04b-followup-004` の `outputs/phase-12/implementation-guide.md` に evidence link を追記する diff を Phase 12 で確定する
4. admin 認証情報・PII が記録に残らない redaction ルールを明文化する

## scope in / out

### Scope In

- staging 専用 reversible D1 seed SQL の追加（synthetic member ID / payload のみ）
- seed 投入 / 撤去 / 検証用 npm script の追加（`scripts/staging/seed-issue-399.sh` 等）
- `/admin/requests` の 7 状態（pending visibility list / pending delete list / detail panel / approve modal / reject modal / empty state / 409 toast）の screenshot 取得手順 runbook
- screenshot redaction（admin email / セッション token / PII 黒塗り）ルール
- evidence directory 構造（`outputs/phase-11/screenshots/{state-name}.png` + `phase11-capture-metadata.json`）
- 親 workflow `04b-followup-004` の `implementation-guide.md` への evidence link 追記の diff 案
- 取得後の seed 撤去 verification（`SELECT count(*) FROM ... WHERE id LIKE 'ISSUE399-%'` が 0 になること）

### Scope Out

- staging への seed 投入実行・実 screenshot 取得（user 承認付き staging runtime cycle / user 実行）
- production への影響を伴う変更
- `/admin/requests` の機能修正 / UI 改修（親タスク 04b-followup-004 で完了済み）
- admin 認証フロー本体の変更
- D1 schema 変更（既存 schema の seed のみ）
- 本仕様書外の commit / push / PR

## dependencies

### Depends On

- 親 workflow: `docs/30-workflows/completed-tasks/04b-followup-004-admin-queue-resolve-workflow/`（CLOSED）
- 親 unassigned source: `docs/30-workflows/completed-tasks/task-04b-admin-queue-resolve-staging-visual-evidence-001.md`（移動済）
- staging 環境の `/admin/requests` ルート稼働（`apps/web` + `apps/api` deploy 済）
- 1Password vault に staging admin account 認証情報が保管されていること
- D1 staging DB binding 稼働

### Blocks

- 親 workflow `04b-followup-004` の visual evidence 完全 close-out
- 「admin queue resolve workflow」の Phase 12 implementation-guide における VISUAL gap の解消

## 苦戦箇所 / Lessons Learned

- **L-04B-RQ-003 由来**: admin session + D1 fixture が必要な UI を local screenshot 未取得のまま「visual evidence complete」と書かない
- **再発防止**: visual evidence が local で取得不能な場合は、Phase 11 で「delegated to follow-up」と明記し、follow-up task をこの仕様書のように同 wave で起票する

## phase 一覧

| Phase | Title | File |
| --- | --- | --- |
| 01 | 要件定義 | [phase-01.md](phase-01.md) |
| 02 | 設計（fixture / runbook / evidence contract） | [phase-02.md](phase-02.md) |
| 03 | 設計レビュー | [phase-03.md](phase-03.md) |
| 04 | テスト戦略 | [phase-04.md](phase-04.md) |
| 05 | 実装ランブック | [phase-05.md](phase-05.md) |
| 06 | 異常系検証 | [phase-06.md](phase-06.md) |
| 07 | AC マトリクス | [phase-07.md](phase-07.md) |
| 08 | DRY 化 | [phase-08.md](phase-08.md) |
| 09 | 品質保証 | [phase-09.md](phase-09.md) |
| 10 | 最終レビュー | [phase-10.md](phase-10.md) |
| 11 | staging visual evidence 取得 | [phase-11.md](phase-11.md) |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) |
| 13 | PR 作成 | [phase-13.md](phase-13.md) |
