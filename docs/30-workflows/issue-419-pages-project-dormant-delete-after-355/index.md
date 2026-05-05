# issue-419-pages-project-dormant-delete-after-355

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | issue-419 |
| mode | serial |
| owner | - |
| 作成日 | 2026-05-04 |
| 改訂日 | 2026-05-04 |
| 状態 | spec_created / NON_VISUAL / destructive-operation |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state | spec_created |
| GitHub Issue | #419（CLOSED 状態のまま扱う。reopen 禁止 / `Refs #355` のみ使用 / `Closes #355` 禁止） |
| 親 Issue | #355（CLOSED） |
| destructiveOperation | true（Pages プロジェクト物理削除は revert 不可） |

## 実装区分

`[実装区分: 実装仕様書]`

本タスクは **コード/設定変更を伴う実装仕様書**である。仕様書だけでは目的（dormant 観察期間経過後に Cloudflare Pages プロジェクトを物理削除し、`aiworkflow-requirements` 正本仕様の Pages 言及を削除済みステータスへ更新する）は達成できず、以下の実体的変更が伴う:

- `bash scripts/cf.sh` の Pages サブコマンド（`pages project list` / `api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` / `pages project delete`）の追加・補強
- dormant 観察期間ログ・preflight evidence・削除実行 evidence・redaction-check の `outputs/` 配下成果物
- `.claude/skills/aiworkflow-requirements/references/` の Pages 言及箇所の「削除済み（YYYY-MM-DD）」への書き換え

そのため CONST_004 に従い「実装仕様書」として作成する。本仕様書は **コード変更手順 / 削除フロー設計 / 観察期間運用 / evidence schema / DoD** を記述するが、**dormant 観察の実走・user 承認取得・実削除コマンド実行・aiworkflow-requirements の実書き換えは本仕様書サイクルの責務外**であり、user 明示承認付き runtime cycle で別 wave として実行する。

## purpose

GitHub Issue #419 (Refs #355) の AC を満たすために、以下を一括で実行可能な状態にする:

1. Workers cutover（Issue #355）完了の preflight evidence（AC-1）と Pages active custom domain 不在 evidence（AC-2）の取得手順を確定する
2. dormant 観察期間（最低 2 週間）の開始日 / 終了日 / 観察結果の記録 schema を確定する（AC-3）
3. user 明示承認の記録 schema を確定する（AC-4）
4. evidence redaction（Cloudflare API token / Bearer / Logpush sink URL / OAuth value）の grep gate を確定する（AC-5）
5. `aiworkflow-requirements` 正本仕様の Pages 言及箇所を「削除済み」へ更新する diff 計画を確定する（AC-6）
6. `bash scripts/cf.sh` 経由の Pages 削除コマンド設計（pages サブコマンド未実装の場合の追加分も含む）

## scope in / out

### Scope In

- Workers cutover preflight evidence（`bash scripts/cf.sh whoami` / Workers production deployments / staging・production smoke 出力）の取得手順
- Pages dormant 状態確認（custom domain attachment が空、最終 deploy が cutover 以前）evidence の取得手順
- dormant 観察期間運用ログ（開始日 / 終了日 / Workers 4xx・5xx 推移 / dormant 状態維持確認）の schema
- user 明示承認の記録 schema（PR description / Issue comment / 本仕様書 outputs に append-only）
- `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` 削除コマンドの設計（pages サブコマンドの追加実装計画を含む）
- 削除後の Workers production smoke 再実行 evidence
- evidence redaction grep gate（`rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)"`）
- `aiworkflow-requirements` references 内 Pages 言及箇所の grep 候補一覧 + 書き換え diff 案

### Scope Out

- Issue #355 本体の Workers deploy / route cutover 実装（親仕様 `issue-355-opennext-workers-cd-cutover-task-spec` で完了）
- custom domain の Workers 側 cutover 実装本体
- Logpush 切替実装（U-4 で別途扱う）
- Cloudflare API token の払い出し / scope 変更
- 本仕様書サイクル内での dormant 観察実走 / 削除コマンド実行 / commit / push / PR
- `wrangler` 直接実行（`bash scripts/cf.sh` 経由のみ許可）

## dependencies

### Depends On

- 親仕様（CLOSED）: `docs/30-workflows/completed-tasks/issue-355-opennext-workers-cd-cutover-task-spec/`
- 起票元 unassigned: `docs/30-workflows/unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md`
- Workers cutover 完了（production route 200 OK / staging・production smoke evidence 完備）
- 1Password vault に `CLOUDFLARE_API_TOKEN` 等が op:// 参照で保管されていること
- `bash scripts/cf.sh` ラッパーが稼働していること

### Blocks

- `aiworkflow-requirements` references 内 Pages 言及箇所の最終クリーンアップ
- Issue #355 の close-out 系列における Pages 残置 risk の解消

## 苦戦箇所 / Lessons Learned

- **L-355-RB-001 由来**: Pages dormant プロジェクトは Workers cutover の rollback 戻り先として機能する。早期削除すると 2 段目の retreat path が消失するため、観察期間を gate 化する必要がある。
- **L-355-EV-002 由来**: NON_VISUAL evidence であっても token / Bearer / sink URL の混入リスクは残るため、redaction grep を CI 相当の手動 gate として明文化する。
- **L-355-CLOSE-003 由来**: 親 Issue #355 は CLOSED のため、本タスクから新規 Issue (#419) を起票する際は `Refs #355` のみ使用し `Closes #355` を書かない（CLOSED Issue の再 close 動作回避）。
- **再発防止**: destructive operation は `bypassPermissions` モードでも単独実行禁止。user 明示承認の記録を AC-4 として gate 化する。

## phase 一覧

| Phase | Title | File |
| --- | --- | --- |
| 01 | 要件定義 | [phase-01.md](phase-01.md) |
| 02 | 設計（観察期間 / 削除フロー / evidence schema） | [phase-02.md](phase-02.md) |
| 03 | 設計レビュー | [phase-03.md](phase-03.md) |
| 04 | テスト戦略 | [phase-04.md](phase-04.md) |
| 05 | 実装ランブック | phase-05.md |
| 06 | 異常系検証 | phase-06.md |
| 07 | AC マトリクス | phase-07.md |
| 08 | DRY 化 | phase-08.md |
| 09 | 品質保証 | phase-09.md |
| 10 | 最終レビュー | phase-10.md |
| 11 | dormant 観察 + 削除 evidence 取得 | phase-11.md |
| 12 | ドキュメント更新（aiworkflow-requirements 反映） | phase-12.md |
| 13 | PR 作成 | phase-13.md |
