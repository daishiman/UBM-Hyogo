# Lessons Learned: UT-CICD-DRIFT（2026-04）

## 概要

UT-CICD-DRIFT は `.github/workflows/*.yml` の現行実体と deployment 系正本仕様の drift を docs-only / NON_VISUAL で解消した。実装変更が必要な差分は `UT-CICD-DRIFT-IMPL-*` に分離した。

## 教訓

### L-CICD-DRIFT-001: deployment 正本は横断検索で閉じる

- 苦戦箇所: 初回同期対象を `deployment-gha.md` / `deployment-cloudflare.md` に絞った結果、`deployment-core.md` と `deployment-secrets-management.md` に古い Node / pnpm / Discord secret 記述が残った。
- 再発防止: workflow topology を更新する場合は `rg -n "node-version|pnpm|web-cd|backend-ci|Discord|CLOUDFLARE|Pages|Workers" .claude/skills/aiworkflow-requirements/references` を同一 wave で実行する。

### L-CICD-DRIFT-002: 存在しない派生タスクIDを書かない

- 苦戦箇所: Discord 通知は UT-08-IMPL に吸収する方針なのに、正本仕様に仮の `UT-CICD-DRIFT-IMPL-002/003` 参照が残った。
- 再発防止: 起票しない改善候補は「既存タスクへ委譲」と明記し、存在しない ID を正本に残さない。

### L-CICD-DRIFT-003: Phase 11 時点の命名衝突ログは Phase 12 後に再確認する

- 苦戦箇所: Phase 11 の「命名衝突 0 件」は、Phase 12 で派生タスクを作成した後の状態と異なる。
- 再発防止: Phase 12 compliance では「Phase 11 実行時点」と「review 後 current state」を分けて記録する。

### L-CICD-DRIFT-004: index 導線は generator だけに依存しない

- 苦戦箇所: `topic-map.md` / `keywords.json` は再生成されたが、`quick-reference.md` / `resource-map.md` の即時導線が弱かった。
- 再発防止: deployment topology のような横断運用タスクは quick-reference / resource-map に手動導線を追加してから generate-index を実行する。

### L-CICD-DRIFT-005: workflow lint 未導入は改善提案ではなく未タスク化する

- 苦戦箇所: `yamllint` / `actionlint` がローカル未導入で N/A になったまま、初回は未タスク化されていなかった。
- 再発防止: 検証未実施の tool gate は `UT-CICD-DRIFT-IMPL-WORKFLOW-LINT-GATE` のように formalize し、PASS と混同しない。
