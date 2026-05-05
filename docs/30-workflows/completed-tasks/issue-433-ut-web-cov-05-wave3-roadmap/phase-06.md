# Phase 6: layer 別集計と gap マッピング

## 目的

Phase 5 の coverage JSON を Phase 3 の layer 集計テンプレートに落とし込み、gap マッピング表を充填する。AC-1 / AC-2 を本 Phase で達成する。

## 1. layer 集計手順

各 `coverage-summary.json` の per-file エントリを path-prefix ルールで layer にグルーピングし、layer ごとに line / branch / function の加重平均（statements 数で重みづけ）を再計算する。

| layer | path-prefix（例） |
| --- | --- |
| admin component | `apps/web/src/components/admin/**`、`apps/web/src/components/layout/**` の admin shell |
| public component | `apps/web/src/components/public/**`、`apps/web/src/components/feedback/**` |
| hook | `apps/web/src/hooks/**`、`apps/web/src/**/use*.ts` |
| lib | `apps/web/src/lib/**`、`apps/api/src/lib/**` |
| use-case | `apps/web/src/**/_use-cases/**`、`apps/api/src/use-cases/**` |
| route handler | `apps/api/src/routes/**`、`apps/api/src/handlers/**` |
| shared module | `packages/shared/src/**`、`packages/integrations/src/**` |

> 実 path-prefix は repo の現状を grep で確認し、`outputs/phase-06/layer-aggregation.md` 冒頭に「適用したルール表」として記録する。drift 時は glossary を更新せず、実 prefix を本 Phase で正本化する。

## 2. 出力: layer-aggregation.md

phase-03 のテンプレに従い 7 layer を行で並べる。`wave-2 touched?` 列は wave-2 5 タスクの implementation-guide から判定する。

## 3. 出力: gap-mapping.md

phase-03 スキーマで file 単位の gap を列挙する。閾値ルール:

- `LINE_GAP`: line% < 80
- `BRANCH_GAP`: branch% < 75
- `FUNCTION_GAP`: function% < 80
- `INTEGRATION_DELEGATED`: phase-04 の `BACKLOG_INTEGRATION` 由来
- `OBSOLETE`: phase-04 の `BACKLOG_DEAD_CODE` 由来

`delegation-target` は本 Phase の時点でも Phase 2 enum 値のいずれかを仮割り当てする。未確定を `TBD` として残すと AC-2 を満たせないため禁止する。Phase 7 では `outputs/phase-07/gap-mapping-resolved.md` を別ファイルとして生成し、Phase 6 の実測 evidence は後編集しない。

## 変更対象ファイル一覧（CONST_005）

なし（集計 markdown のみ）

## 入力 / 出力 / 副作用

- 入力: `outputs/phase-05/coverage-summary-*.json`、`outputs/phase-04/wave2-backlog-inventory.md`、`outputs/phase-03/*`
- 出力: `outputs/phase-06/main.md`、`layer-aggregation.md`、`gap-mapping.md`
- 副作用: なし

## テスト方針

- layer 集計表に 7 layer すべての行が存在
- gap-class が enum 値のみで、unknown が混入していない（grep で検査）
- gap マッピング表の列数とスキーマ列数が一致

## ローカル実行・検証コマンド

```bash
test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-06/layer-aggregation.md
test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-06/gap-mapping.md
grep -E '\b(LINE_GAP|BRANCH_GAP|FUNCTION_GAP|INTEGRATION_DELEGATED|OBSOLETE)\b' \
  docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-06/gap-mapping.md > /dev/null
```

## 完了条件 / DoD

- [ ] AC-1: layer 別 line/branch/function 集計が markdown で存在
- [ ] AC-2: layer × file × gap-class × delegation-target の gap マッピング表が存在し、`delegation-target` に `TBD` がない
- [ ] enum 値の grep 検査 PASS

## 出力

- outputs/phase-06/main.md
- outputs/phase-06/layer-aggregation.md
- outputs/phase-06/gap-mapping.md

## 参照資料

- outputs/phase-03/layer-aggregation-template.md
- outputs/phase-03/gap-mapping-schema.md
- outputs/phase-04/wave2-backlog-inventory.md

## メタ情報

- Phase: 6
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- coverage JSON を layer 別に集計し、gap mapping を作成する。

## 成果物/実行手順

- `outputs/phase-06/main.md`、`layer-aggregation.md`、`gap-mapping.md` を作成する。

## 統合テスト連携

- NON_VISUAL。enum 値と列数の整合を grep / table check で確認する。
- outputs/phase-05/coverage-summary-*.json
