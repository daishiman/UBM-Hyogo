# Skill Feedback Report — issue-1192-admin-account-profile-dedicated-ux

> **本ファイルは feedback と反映結果の台帳**。今回の実装サイクルでは F-1 を task-specification-creator へ反映し、aiworkflow-requirements 側にも Issue #1192 artifact inventory / index 登録を追加した。

## Feedback 候補

### F-1: 「調査結論待ち」unassigned-task の前提を現行コードの構造的事実で代替確定するパターン

| 項目 | 内容 |
| --- | --- |
| 観測事象 | 元 Issue #1192 は「AC-2 結論待ち（管理者が member identity を持つか D1 read-only 確認待ち）で着手不可」とされていた。しかし着手時の現行コード調査で、`resolveSession`（`apps/api/src/use-cases/auth/resolve-session.ts`）が **member identity を解決できない email へ session を発行しない**構造であることを確認し、「ログイン済み管理者は構造的に必ず member identity を持つ」と**コード事実で前提を代替確定**できた。D1 データ確認は不要だった（データ次第で覆る前提ではなく、コード構造が保証するため） |
| 汎化 | 「AC-x 等の調査結論待ち」状態の unassigned-task は、着手時に**現行コードの構造的事実（session 発行条件・型制約・到達可能性等）で前提を代替確定できる場合がある**。外部データ確認（D1 read-only 等）を待たずに、コード構造が一意に保証するケースを Phase 1 の P50 前提確認チェックで先に検査する手順を明文化すると、着手不可と誤判定されたタスクの解凍が速くなる |
| 反映先候補 | `.claude/skills/task-specification-creator/references/phase-template-phase1.md`（P50 前提確認チェックの記述に「コード構造による前提代替確定」の検査観点を追加） |
| 反映タイミング | **今回の実装サイクルで実施済み** |

## 本タスクで行った skill 変更

| 対象 | 変更内容 |
| --- | --- |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-template-phase1.md` に「調査待ち前提のコード構造による代替確定（Issue #1192 対策）」を追加 |
| aiworkflow-requirements | active ledger、quick-reference、resource-map、topic/keyword indexes、Issue #1192 artifact inventory を追加・再生成 |

## ワークフロー改善メモ（次回の同型タスク向け）

1. CLOSED Issue の current-code 再スコープでは、「Issue は CLOSED のまま維持 + workflow dir を canonical」とする宣言を Phase 1 と Phase 12/13 の双方に明記する（再オープン・close キーワード混入の防止）。
2. implemented_local_evidence_captured 段階の strict 7 は「local implementation evidence と user-gated 残存項目を分離する」語彙で統一し、false PASS を防ぐ。
3. VISUAL タスクで認証必須画面の screenshot が user-gated になる場合、jsdom render を一次証跡とする two-tier evidence を Phase 3 リスク表の段階で確定しておく。
