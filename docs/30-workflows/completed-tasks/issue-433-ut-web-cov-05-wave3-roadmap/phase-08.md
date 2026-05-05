# Phase 8: wave-3 候補タスクリスト作成

## 目的

Phase 6 / 7 の出力をもとに wave-3 候補タスクを 5〜10 件抽出し、phase-03 rubric でスコアリングして優先度順に並べる。AC-3 を本 Phase で達成する。

## 候補抽出フロー

1. gap-mapping.md の行を gap-class × layer × delegation-target でクラスタリング
2. 同一 layer / 同一 delegation-target / 同一テーマ（auth / public / admin / api routes / shared）のクラスタを 1 タスク候補として slug 化
3. 各候補に rubric 評価（業務影響 / 実装規模 / dependency / coverage 寄与）を適用
4. スコア降順で 5〜10 件選定（最大 10 件）

## 出力: wave3-candidate-tasks.md

```
| rank | slug | 概要 | 主 layer | delegation-target | 業務影響 | 規模 | dependency | 寄与% | スコア | 根拠 |
```

slug 命名規約: `ut-web-cov-<連番>-<英数字 kebab>`（wave-2 慣習を継承）。新領域は `ut-api-cov-*` / `ut-shared-cov-*` を許容。

## 変更対象ファイル一覧（CONST_005）

なし（候補リスト markdown のみ）

## 入力 / 出力 / 副作用

- 入力: `outputs/phase-03/wave3-scoring-rubric.md`、`outputs/phase-06/gap-mapping.md`、`outputs/phase-07/non-visual-backlog.md`
- 出力: `outputs/phase-08/main.md`、`wave3-candidate-tasks.md`
- 副作用: なし

## テスト方針

- 候補件数 5〜10 件以内
- スコア計算式が rubric と一致（spot check で 2〜3 件再計算）
- slug が `^ut-(web|api|shared)-cov-` または承認済 prefix にマッチ

## ローカル実行・検証コマンド

```bash
file=docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-08/wave3-candidate-tasks.md
test -f "$file"
count=$(grep -cE '^\| [0-9]+ \|' "$file")
[ "$count" -ge 5 ] && [ "$count" -le 10 ] && echo "PASS: $count candidates"
```

## 完了条件 / DoD

- [ ] 候補数が 5〜10 件
- [ ] 全候補に rank / slug / 概要 / layer / delegation-target / 業務影響 / 規模 / dependency / 寄与 / スコア / 根拠 が埋まる
- [ ] slug が命名規約に準拠

## 出力

- outputs/phase-08/main.md
- outputs/phase-08/wave3-candidate-tasks.md

## 参照資料

- outputs/phase-03/wave3-scoring-rubric.md
- outputs/phase-06/gap-mapping.md
- outputs/phase-07/non-visual-backlog.md

## メタ情報

- Phase: 8
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- wave-3 candidate tasks を 5〜10 件に scoring する。

## 成果物/実行手順

- `outputs/phase-08/main.md` と `wave3-candidate-tasks.md` を作成する。

## 統合テスト連携

- NON_VISUAL。候補数と slug 命名規約を検証する。
