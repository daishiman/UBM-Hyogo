# skill feedback report

## テンプレ改善

改善あり。Phase 12 close-out では `git status --short apps packages` と workflow state を照合し、`apps/` または `packages/` dirty diff がある場合は `spec_created` のまま PASS にしない dirty diff/state vocabulary gate を明記する。

## ワークフロー改善

改善あり。`automation-30` の compact evidence table 許容は維持しつつ、検証対象に「仕様書の状態語彙」と「実ワークツリー差分」の照合を必須観点として追加する。

## ドキュメント改善

改善あり。`aiworkflow-requirements` 側の導線不足に加え、`apps/web` 実装済み差分を `implemented-local / IMPLEMENTED_LOCAL_RUNTIME_PENDING` として同期する必要があった。quick-reference / resource-map / task-workflow-active / changelog / LOGS へ反映して解消した。

## Routing

| item | route | reason |
| --- | --- | --- |
| Phase 12 strict 7 欠落 | workflow files | 対象 workflow の出力実体不足 |
| aiworkflow index 未登録 | aiworkflow references/indexes | 正本導線の同期漏れ |
| dirty diff/state vocabulary gate | task-specification-creator feedback | `apps/` / `packages/` dirty diff がある `spec_created` PASS を禁止する |
| workflow diff/state照合 | automation-30 feedback | 30種思考法 compact table でも状態語彙と実差分の照合を省略しない |
