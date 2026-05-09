# Phase 11: 手動テスト検証

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 11 |
| 名称 | 手動テスト検証 |
| 依存Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10 |
| visualEvidence | VISUAL_ON_EXECUTION |
| 次Phase | Phase 12 |

## 目的

UI primitive の runtime visual evidence を、実装完了後の実行 cycle で取得する契約を固定する。仕様 formalization 時点では screenshot を PASS 主張しない。

## 実行タスク

- Task 11-1: runtime execution 時に `/(dev)/ui-preview` または Storybook 相当の catalog route を起動する。
- Task 11-2: `ui-primitives-catalog`, `sidebar-active-state`, `field-states`, `banner-tones` の screenshot を取得する。
- Task 11-3: axe violations 0 と Tab order を確認する。
- Task 11-4: 実行前の spec_created cycle では `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md` に boundary を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 10 | `phase-10.md` | final review |
| Phase 12 | `phase-12.md` | documentation sync |
| screenshot validator | `.claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js` | runtime visual validation |

## 実行手順

1. 実装完了後に dev server を起動する。
2. catalog / Sidebar / Field / Banner の 4 状態を撮影する。
3. axe と keyboard 操作を確認する。
4. 実行結果を `outputs/phase-11/manual-test-result.md` と `outputs/phase-11/screenshots/` に保存する。

## 統合テスト連携

本 workflow の `visualEvidence` は `VISUAL_ON_EXECUTION` である。spec_created close-out では NON_VISUAL 相当の placeholder ledger を置き、runtime screenshot を成功証跡として扱わない。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% は Phase 9 の local gate で確認する。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| システム思考 | screenshot は実装完了後の runtime state と結びつける |
| 因果関係分析 | placeholder を PASS 扱いすると false green になる |
| 素人思考 | 画面で見たときに部品の役割が判別できるか確認 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| boundary ledger | `outputs/phase-11/main.md` |
| runtime screenshot | `outputs/phase-11/screenshots/*.png` |

## 成果物

| 成果物 | パス |
| --- | --- |
| main | `outputs/phase-11/main.md` |
| manual smoke | `outputs/phase-11/manual-smoke-log.md` |
| link checklist | `outputs/phase-11/link-checklist.md` |
| runtime result | `outputs/phase-11/manual-test-result.md` |

## 完了条件

- [ ] spec_created cycle では runtime screenshot を PASS 主張していない。
- [ ] `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md` が存在する。
- [ ] runtime execution cycle で screenshot と axe evidence を取得する手順が明記されている。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% の Phase 9 結果を参照している。

## タスク100%実行確認【必須】

- [ ] Task 11-1 完了
- [ ] Task 11-2 完了
- [ ] Task 11-3 完了
- [ ] Task 11-4 完了

## 次Phase

Phase 12 で strict 7 files と aiworkflow 正本同期を完了する。
