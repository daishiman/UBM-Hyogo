# Skill Feedback Report — issue-1138-smoke-runner-common-lib-extraction

> 改善点なしでも出力必須。本タスクは NON_VISUAL bash refactoring（共通 lib 抽出）であり、テンプレート / ワークフロー / ドキュメントの 3 観点で改善余地を記録する。

## task-specification-creator skill への feedback

| # | 観点 | 内容 | 提案 |
| - | ---- | ---- | ---- |
| FB-1 | bash refactoring NON_VISUAL タスクの非退化検証パターン | 本タスクは「共通 lib を 3 runner が `source` し、さらに test が `source "$RUNNER"` する二段 source」で全関数が解決されることを保証する必要がある（AC-10）。この `source RUNNER → source lib` 二段解決の非退化検証は bash 共通化タスクで再発する定型パターンだが、現状 skill に reference がない | `references/patterns-testing-and-implementation.md`（または新規 `references/patterns-bash-lib-extraction.md`）に「source RUNNER 二段解決の非退化検証パターン」（lib 化後も `source "$RUNNER"` 後に runner 固有関数が呼べること / `main` ガード維持 / `set`・`trap` を lib に持たせない）を reference 化する余地 |
| FB-2 | 「公開インターフェース追加だが正本変更 N/A」型の Step 2 判定 | 本タスクは新規 public surface（`smoke_*` 9 関数）を追加するが、これは内部開発者向け bash lib 契約であり aiworkflow-requirements 正本（API/DB/UI）の変更ではない。この「公開 surface はあるがドメイン正本は N/A・workflow 内に記録」判定はテンプレに明文化されておらず、誤って正本更新を試みるリスクがある | `system-spec-update-summary` テンプレに「公開 surface 追加 ≠ ドメイン正本変更」の判定分岐（内部 lib / CLI / CI 派生物は workflow 内記録に留め、API/DB/UI 正本は N/A）を定型節として追記 |

## aiworkflow-requirements skill への feedback

| # | 観点 | 内容 | 提案 |
| - | ---- | ---- | ---- |
| FB-3 | 派生物（CI / smoke / 内部 lib 層）の正本登録判定 | 共通 lib `smoke-common.sh` は API/IPC/UI/auth/schema の契約変更ではない「派生物（smoke 層）」である。ただし workflow registration と implemented_local_evidence_captured status は aiworkflow 台帳へ同期する必要がある（ドメイン spec は更新しない） | aiworkflow-requirements の `task-workflow-active.md` へ本 workflow を登録。quick-reference / resource-map / API endpoint schema / D1 schema / UI route は変更なし |

## 所有スキルファイルへの反映方針

- 本タスクは `implemented_local_evidence_captured`（実装 user-gated）のため、global skill 正本ファイル（`.claude/skills/**`）への即時書き込みは行わず、上記改善観点を記録するに留める。skill 反映は実装 close-out（Gate-B 後）に user-gated で実施する。
- task-specification-creator: FB-1（二段 source 非退化検証パターンの reference 化）/ FB-2（公開 surface ≠ ドメイン正本変更の Step 2 判定）を反映候補として記録。
- aiworkflow-requirements: FB-3（派生物の workflow registration のみ同期・ドメイン spec 不変）を反映候補として記録。
- ドキュメント改善観点: 本 workflow の implementation-guide.md Part 1 で採用した「3 人がそれぞれ持つ道具を共有道具箱に 1 セットだけ入れる」例えは、bash 共通 lib 抽出の中学生レベル説明テンプレとして再利用余地がある。
