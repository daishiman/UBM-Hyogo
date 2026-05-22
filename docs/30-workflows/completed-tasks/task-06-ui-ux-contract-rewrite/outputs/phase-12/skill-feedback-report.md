# skill-feedback-report.md

## 対象 skill

1. `task-specification-creator`
2. `aiworkflow-requirements`

## task-specification-creator skill への feedback

### 観察

- 本タスク（task-06）は NON_VISUAL × implementation-spec の組み合わせで、Phase 11（手動 smoke）が「スクリーンショット不要・代替 evidence で縮約」する運用パターンになった
- このパターンは markdown contract 書き換えタスクで頻発し、すでに task-01 の solo scope gate でも同様の縮約が見られる

### 採用済み反映

`task-specification-creator` skill の履歴へ以下の判断を反映済み:

- `visualEvidence: NON_VISUAL` フラグを meta-info に追加
- フラグ ON の場合、Phase 11 の成果物として以下 4 種の evidence 構造を明示:
  - `evidence/grep-gate.log`（HEX/oklch/px/`bg-[`/`text-[` の 0 件確認）
  - `evidence/structure-check.log`（H2/H3 数の決定論的一致）
  - `evidence/markdown-lint.log`（exit 0）
  - `evidence/trace-check.log`（contract → impl mapping 整合）
- 加えて `phase-11-non-visual-alternative-evidence.md` を必須ドキュメントとして追加し、なぜ visual evidence を取得しないかの根拠を明示

### 期待効果

- markdown contract タスクで Phase 11 の縮約手順が標準化
- レビュー時に「スクリーンショットがない」という誤検出を回避
- Phase 12 implementation-guide.md でスクリーンショットへの言及を強制しない（NON_VISUAL タスクで余計な分岐を消せる）

## aiworkflow-requirements skill への feedback

### 観察

- 09-ui-ux.md §0.7 の grep 起点設計（`grep -n "^### 2\."` で 19 routes index、`grep -n "^#### 3\.1\."` で 13 primitives index など）は「契約 → 実装」の決定論的写像の良い実例
- aiworkflow-requirements skill は Progressive Disclosure を anchor としており、本タスクの grep 設計と思想が一致

### 採用済み反映

`aiworkflow-requirements` skill の `indexes/keywords.json` に以下 trigger を追加済み:

- `09-ui-ux contract grep`
- `routes index grep`
- `primitives index grep`
- `a11y contract grep`
- `token prefix grep`

これにより「09-ui-ux.md の grep 起点を使いたい」というユーザー意図が skill 起動条件にマッチし、Progressive Disclosure で必要最小限のセクションだけ読み出せる。

### 期待効果

- 後続 task-07/08/09/10/11..17 が `aiworkflow-requirements` skill 経由で 09-ui-ux.md の参照点に最短到達
- skill との整合監査が容易（grep 設計が skill の anchor と直結）

## まとめ

両 skill とも **「採用済みパターンの一般化」** が feedback の核心。本タスクで実証された運用ノウハウ（NON_VISUAL evidence 4 種 / contract grep 起点）を skill テンプレ・index に取り込むことで、後続タスクの迷子率を下げる。
