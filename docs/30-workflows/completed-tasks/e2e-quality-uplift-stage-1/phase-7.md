# Phase 7: カバレッジ確認（standard tier / critical route smoke 100%）

> workflow: `e2e-quality-uplift-stage-1` / 起案日: 2026-05-09

## 1. tier 定義（再掲）

| tier | lines / branches 閾値 | critical route smoke |
|------|---------------------|--------------------|
| standard | lines >= 80% | 100%（top-5 critical 全 route が smoke 対象） |

## 2. critical route 一覧と本サイクル関与

| route | critical 区分 | 本サイクル関与 | smoke 状態 |
|-------|-------------|---------------|----------|
| `/` | top-5 | 1a で leak guard 追加 | OK |
| `/(public)/members` | top-5 | 1a | OK |
| `/(public)/members/[id]` | top-5 | 1a | OK |
| `/profile` | top-5 | 1b で sticky guard 追加 | OK |
| `/login` | top-5 | 関与なし | 既存維持 |

> critical smoke 100% は Stage 0（PR #594 unskip）で達成済。Stage 1 は同 5 route の **assertion 質**を底上げする。

## 3. lines >= 80% 達成戦略

本サイクルは production code を変更しないため、lines coverage 値は理論上不変。ただし regression-guard 強化により coverage の **意味的価値** が上がる点を以下に整理する。

| 観点 | 値 |
|------|----|
| 既存 lines coverage | （Stage 0 終了時点の baseline を継承、本 stage で再計測しない） |
| 本 stage の delta | E2E spec 行数増加分のみ（`apps/web/playwright/**` は coverage 計測対象外想定） |
| 70% 達成手段 | 既存 unit / integration の維持で十分（本 stage 単体では coverage 改善義務なし） |
| coverage gate | `pnpm typecheck` / `pnpm lint` / 既存 playwright smoke job が green であることをもって本 stage の coverage 整合とする |

## 4. critical route 別 assertion 充足表

| route | 既存 assertion | Stage 1 後 |
|-------|--------------|-----------|
| `/` | render OK / heading 表示 | + email leak 不在 |
| `/(public)/members` | list 表示 | + email leak 不在 |
| `/(public)/members/[id]` | detail heading | + email leak 不在 |
| `/profile` | submit→202→pending visible | + round-trip 後 pending visible |

## 5. coverage 値の再計測要否

| 計測対象 | 要否 | 理由 |
|---------|------|------|
| Vitest line coverage | 不要 | production code 変更ゼロ |
| Playwright smoke pass rate | 必須 | 1a / 1b の追加 test が緑であること |
| critical route smoke 件数 | 100% 維持 | top-5 全件で smoke が緑 |

## 6. Phase 8 入口条件

- [x] Stage 0 baseline coverage が回帰していない
- [x] critical 5 route の smoke が 1 件も skip / fail していない
- [x] 本 stage の追加 spec が `--reporter=list` で確認可能

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 7
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

