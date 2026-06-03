# Documentation Changelog — サイドバー表示条件の正本化

> 各 Step の結果を個別に明記する（「該当なし」も記録する）。
> workflow-local 同期と global skill sync を別ブロックに分離する（Feedback BEFORE-QUIT-003）。

## Block 1: workflow-local 同期（本サイクルで実体化）

| Step | 結果 | 対象ファイル |
| --- | --- | --- |
| 1-A 完了記録 | 反映あり | `phase-10-final-review.md` / `phase-11-manual-test.md` / `outputs/phase-11/manual-test-result.md` / `phase-12-documentation.md` を新規作成 |
| 1-B 実装状況テーブル | 反映あり | `outputs/phase-12/main.md` / `phase12-task-spec-compliance-check.md` に `implemented_local_evidence_captured` を記録 |
| 1-C 関連タスクテーブル | 反映あり | strict 7 内に親系譜（Task A/B/C/E・issue-1024 は dev マージ済み）を記録 |
| Step 2 interface / 正本契約同期 | **該当あり** | 09h §1.6 マトリクスへ `(auth) /login bare` を明示。09h §1.2 admin nav を実装に合わせて 14 item / `Form回答` 外部リンク / `出席分析` route へ補正。新規 public interface（新 export）は無し |

## Block 2: global skill sync（aiworkflow-requirements）

| 対象 | 結果 |
| --- | --- |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6 | **反映あり**。route group `(auth)` をマトリクスへ明示し、admin nav 契約（14 item / Form回答 / 出席分析 route）を実装へ同期 |
| `references/task-workflow-active.md` | **反映あり**。本 workflow を `implemented_local_evidence_captured / implementation / VISUAL` として登録 |
| artifact inventory | **反映あり**。本 workflow の artifact inventory を同 wave で登録 |
| indexes（resource-map / quick-reference） | **反映あり**。lookup 行を追加。`topic-map` / `keywords` は generator 管轄のため手編集なし（`pnpm indexes:rebuild` 委譲） |
| lessons-learned | **反映あり**。route topology drift 解消 / two-tier evidence 境界の知見を lessons へ昇格 |
| SKILL-changelog / LOGS | **反映あり**。aiworkflow-requirements と task-specification-creator の changelog / LOGS に同 wave 追記 |

## Block 3: artifacts / gates

| 対象 | 結果 |
| --- | --- |
| `artifacts.json` / `outputs/artifacts.json` | 更新（`implemented_local_evidence_captured` / gates A=passed, B=passed, C=pending（runtime/release））。root/output parity 維持 |
| Gate-A | passed（Phase 3 設計レビュー PASS / Phase 10 最終レビュー BLOCKER なし） |
| Gate-B | passed（実コード実装 + direct focused vitest / typecheck / lint 完了） |
| Gate-C | pending（pixel screenshot / staging visual baseline / commit / push / PR は user-gated） |

## validator 再実行（本サイクル想定）

| コマンド | 結果（想定） |
| --- | --- |
| `pnpm verify:phase12-compliance` | PASS（strict 7 present / canonical 9 見出し / hasCompletedTasksAncestor=false） |
| `pnpm gate-metadata:validate ...` | PASS（gates schema 準拠） |
| `pnpm indexes:rebuild` | 未実行（manual index rows only。generator output drift は最終検証で確認） |
