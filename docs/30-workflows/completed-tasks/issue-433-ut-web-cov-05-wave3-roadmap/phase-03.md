# Phase 3: 設計

## 目的

layer 集計テンプレート / gap マッピング表スキーマ / wave-3 スコアリング基準を確定する。Phase 5 の coverage 計測結果が来たときに「埋めるだけ」の状態にする。

## 1. layer 集計テンプレート

```
| layer | files | line%（current） | branch%（current） | function%（current） | uncovered files | wave-2 touched? |
| --- | --- | --- | --- | --- | --- | --- |
| admin component | … | … | … | … | … | yes/no |
| public component | … | … | … | … | … | yes/no |
| hook | … | … | … | … | … | yes/no |
| lib | … | … | … | … | … | yes/no |
| use-case | … | … | … | … | … | yes/no |
| route handler | … | … | … | … | … | yes/no |
| shared module | … | … | … | … | … | yes/no |
```

`coverage-summary.json` の `total` を layer グルーピング（path prefix）で再集計する。layer 判定の path-prefix ルールは glossary.md に追記する。

## 2. gap マッピング表スキーマ

```
| layer | file | line% | branch% | function% | gap-class | delegation-target | rationale |
```

- `gap-class`: enum（LINE_GAP / BRANCH_GAP / FUNCTION_GAP / INTEGRATION_DELEGATED / OBSOLETE）
- `delegation-target`: enum（unit / integration / e2e / manual-smoke / obsolete-removal）
- 行は coverage threshold 未達の file 単位 + NON_VISUAL backlog 起源の virtual エントリ

## 3. wave-3 候補タスクのスコアリング基準（rubric）

| 軸 | 値 | 重み |
| --- | --- | --- |
| 業務影響 | 1（限定）/ 2（中）/ 3（直接ユーザー動線） | ×3 |
| 実装規模 | S=1（〜0.5d）/ M=2（〜2d）/ L=3（〜1w） | ×−1（小さいほど高優先） |
| dependency | 0（独立）/ 1（他タスク前提あり）/ 2（外部要因待ち） | ×−2 |
| coverage 寄与 | line/branch/function 合算の予測 % delta | ×2 |

**優先度スコア = 業務影響×3 − 実装規模 − dependency×2 + 寄与×2**。スコア降順で 5〜10 件を選定する。

## 変更対象ファイル一覧（CONST_005）

なし（設計テンプレ確定のみ。outputs に保存）

## 入力 / 出力 / 副作用

- 入力: glossary.md、index.md
- 出力: `outputs/phase-03/main.md`、`layer-aggregation-template.md`、`gap-mapping-schema.md`、`wave3-scoring-rubric.md`
- 副作用: なし

## テスト方針

- 3 つのスキーマ / テンプレートが Phase 6 / 8 で「列が足りない」事態を起こさないかを spot check
- enum 値が glossary.md と完全一致

## ローカル実行・検証コマンド

```bash
for f in layer-aggregation-template.md gap-mapping-schema.md wave3-scoring-rubric.md main.md; do
  test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-03/$f && echo "PASS: $f" || echo "FAIL: $f"
done
```

## 完了条件 / DoD

- [ ] 3 つの artefact（layer-aggregation-template / gap-mapping-schema / wave3-scoring-rubric）が outputs に配置
- [ ] enum 値が glossary.md と完全一致
- [ ] スコアリング rubric の優先度式が明示

## 出力

- outputs/phase-03/main.md
- outputs/phase-03/layer-aggregation-template.md
- outputs/phase-03/gap-mapping-schema.md
- outputs/phase-03/wave3-scoring-rubric.md

## 参照資料

## メタ情報

- Phase: 3
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- layer aggregation、gap mapping、scoring rubric を定義する。

## 成果物/実行手順

- `outputs/phase-03/*` のテンプレート 3 点と main を作成する。

## 統合テスト連携

- NON_VISUAL。Phase 6〜8 の出力で schema 適合を確認する。

- docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-02/glossary.md
- docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md §3.2
