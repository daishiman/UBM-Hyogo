# skill フィードバックレポート: issue-1029 public member photo display

> **[実装区分: 実装仕様書]**。本 workflow は `implemented_local_runtime_pending`。3 観点（テンプレート改善 / ワークフロー改善 / ドキュメント改善）を記録する。改善点が無い観点も「なし」と明記する。

---

## 1. テンプレート改善

| # | 観点 | 内容 |
|---|------|------|
| 1 | implemented_local_runtime_pending × VISUAL_ON_EXECUTION の Phase 11 inventory 記法 | VISUAL タスクでローカル実装と focused test/typecheck が完了しており、local mock runtime screenshot も取得できる場合は screenshot を `present` にする。staging deploy/R2 secrets が user-gated の場合は、実 R2 URL capture だけ Gate-C external ops として分離すると verifier と成果物実態が一致する。 |

## 2. ワークフロー改善

| # | 観点 | 内容 |
|---|------|------|
| 1 | upstream 資産再利用タスクの成果物 canonical 継承 | #983（landed）の `member_photos` / `presignMemberPhotoGetUrl` / `Avatar src?` を再利用する本 task では、新規成果物名を生やすより upstream の identifier をそのまま継承する方が drift を防ぐ。`outputs/phase-1/spec-extraction-map.md` に「再利用 anchor」表を置き、実コード行番号で固定したことで、implementation-guide の識別子が手書きにならず実コード由来を担保できた。資産再利用タスクの定型ステップとして「upstream anchor 表を Phase 1 で固定 → Phase 12 で identifier 継承」をワークフローに組み込む価値がある。 |
| 2 | resolver DI optional パターンの後方互換ガイド | route 層 presign を use-case に optional resolver で DI する設計は、既存テストを壊さず（未注入で従来動作）に新フィールドを足せる。public list/profile の N+1 防止 batch helper + optional resolver の組合せは #224 と同型で、ワークフロー横断の定番パターンとして reference 化できる。 |

## 3. ドキュメント改善

| # | 観点 | 内容 |
|---|------|------|
| 1 | implementation の code boundary 明示 | implementation 区分では「実コード差分 / local evidence / runtime user-gated」を documentation-changelog の冒頭で明示すると、Phase 12 検証時に何が完了済みで何が外部 gate なのか判別しやすい。 |
| 2 | workflow-local 同期と global skill sync の分離記録 | [Feedback BEFORE-QUIT-003] の「ブロック A / ブロック B」分離記法は、実コード実装済みと正本 docs 同期済みを同時に表現するのに有効だった。docs reference にこの分離テンプレートを示すと sync 漏れを防げる。 |
