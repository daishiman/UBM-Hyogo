# Phase 10: 最終レビューゲート

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 10 |
| 名称 | 最終レビューゲート |
| 依存Phase | Phase 1, Phase 2, Phase 5, Phase 9 |
| 次Phase | Phase 11 |

## 目的

task-10 の DoD と AC-1〜AC-10 を final review し、Phase 11 runtime visual evidence に進むか判定する。

## 実行タスク

- Task 10-1: AC-1〜AC-10 を PASS / MINOR / MAJOR で判定する。
- Task 10-2: Phase 9 quality logs を確認する。
- Task 10-3: downstream task-11..17 の import readiness を確認する。
- Task 10-4: MINOR がある場合は Phase 12 の unassigned-task-detection ではなく今回 cycle 内修正を原則にする。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC |
| Phase 9 | `phase-09.md` | quality logs |
| Phase 11 | `phase-11.md` | runtime evidence |

## 実行手順

| DoD | 検証 |
| --- | --- |
| 11 primitive contract | barrel export test |
| existing export compatibility | `apps/web/src/components/ui/index.ts` |
| OKLch token | token gate |
| a11y | jest-axe / role test |
| build | build:cloudflare |
| coverage | Phase 7 / Phase 9 |

## 統合テスト連携

Phase 10 は新規 test を追加しない。Phase 9 の typecheck / test / coverage / build を review evidence とする。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を満たさない場合は Phase 6 または Phase 8 へ戻す。

## 多角的チェック観点（AIが判断）

| 条件 | 判定 |
| --- | --- |
| 矛盾なし | AC と implementation が一致 |
| 漏れなし | DoD すべて判定 |
| 整合性あり | export / file naming / docs が一致 |
| 依存関係整合 | downstream import readiness が成立 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| final review | `outputs/phase-10/main.md` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 10 main | `outputs/phase-10/main.md` |

## 完了条件

- [ ] AC-1〜AC-10 が判定済みである。
- [ ] MAJOR が 0 件である。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を満たしている。
- [ ] Phase 11 へ進む条件を満たしている。

## タスク100%実行確認【必須】

- [ ] Task 10-1 完了
- [ ] Task 10-2 完了
- [ ] Task 10-3 完了
- [ ] Task 10-4 完了

## 次Phase

Phase 11 で runtime visual evidence を取得する。
