# Phase 6: テスト拡充

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 6 |
| 名称 | テスト拡充 |
| 依存Phase | Phase 5 |
| 次Phase | Phase 7 |

## 目的

task-10 契約の variant、a11y、後方互換を regression guard として固定する。

## 実行タスク

- Task 6-1: `Button / Badge / Banner` の tone / variant test を追加する。
- Task 6-2: `Field / Input / Select` の aria 接続 test を追加する。
- Task 6-3: `Sidebar` の `aria-current` と `matchPrefix` test を追加する。
- Task 6-4: barrel export test を追加する。
- Task 6-5: test 結果を `outputs/phase-06/test-result.txt` に保存する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 5 | `phase-05.md` | GREEN 実装 |
| Phase 7 | `phase-07.md` | coverage |
| current tests | `apps/web/src/components/ui/__tests__/primitives.test.tsx` | 既存 regression |

## 実行手順

1. contract test に加えて variant と edge case を追加する。
2. `pnpm --filter @ubm-hyogo/web test` を実行する。
3. fail があれば Phase 5 に戻して実装を補正する。

## 統合テスト連携

Phase 6 の test GREEN を Phase 7 coverage 測定の前提にする。coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を下限とする。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| 帰納的思考 | 代表 variant の test から契約の安定性を確認 |
| MECE | export / props / aria / role / token を分けて検証 |
| 改善思考 | regression guard を追加して将来 drift を防ぐ |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| test expansion | `apps/web/src/components/ui/__tests__/task10-contract.test.tsx` |
| result | `outputs/phase-06/test-result.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| test result | `outputs/phase-06/test-result.txt` |

## 完了条件

- [ ] `pnpm --filter @ubm-hyogo/web test` が成功している。
- [ ] barrel export test がある。
- [ ] a11y role / aria test がある。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を Phase 7 に引き継いでいる。

## タスク100%実行確認【必須】

- [ ] Task 6-1 完了
- [ ] Task 6-2 完了
- [ ] Task 6-3 完了
- [ ] Task 6-4 完了
- [ ] Task 6-5 完了

## 次Phase

Phase 7 で coverage を測定する。
