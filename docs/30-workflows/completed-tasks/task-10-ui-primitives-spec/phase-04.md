# Phase 4: テスト作成

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 4 |
| 名称 | テスト作成 |
| 依存Phase | Phase 1, Phase 2, Phase 3 |
| 次Phase | Phase 5 |

## 目的

既存 UI 実装を前提に、task-10 契約の不足を検出する contract test を先に作成する。

## 実行タスク

- Task 4-1: `apps/web/src/components/ui/__tests__/task10-contract.test.tsx` を作成する。
- Task 4-2: barrel import で 11 primitive と variants が取得できる test を書く。
- Task 4-3: `Button / Avatar / Field / Input / Select` の後方互換 props と追加 props を test にする。
- Task 4-4: `Card / Badge / Sidebar / Stat / EmptyState / Banner` の smoke + a11y test を書く。
- Task 4-5: RED 結果を `outputs/phase-04/red-result.txt` に保存する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 2 | `phase-02.md` | C/M/R |
| existing tests | `apps/web/src/components/ui/__tests__/primitives.test.tsx` | 現行 test baseline |
| Phase 5 | `phase-05.md` | GREEN 実装 |

## 実行手順

1. 既存 `primitives.test.tsx` を残し、task-10 contract test を追加する。
2. `pnpm --filter @ubm-hyogo/web test` を実行し、現行不足による fail を RED とする。
3. import error だけに依存せず、props / aria / role / token class の不足を検出する。

## 統合テスト連携

RED は `pnpm --filter @ubm-hyogo/web test` で確認する。Phase 7 では coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% に加え、UI primitive 対象の上振れ閾値を確認する。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| why思考 | RED 不成立の原因を既存実装あり前提で解消 |
| 仮説思考 | 不足 API contract test なら現行不足を正しく検出できる |
| MECE | 既存拡張と新規不足を別 test group にする |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| contract test | `apps/web/src/components/ui/__tests__/task10-contract.test.tsx` |
| RED log | `outputs/phase-04/red-result.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| contract test | `apps/web/src/components/ui/__tests__/task10-contract.test.tsx` |
| RED result | `outputs/phase-04/red-result.txt` |

## 完了条件

- [ ] task-10 contract test が存在する。
- [ ] RED 結果が import error のみではなく不足 API を示す。
- [ ] 既存 test file を削除していない。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を Phase 7 に引き継いでいる。

## タスク100%実行確認【必須】

- [ ] Task 4-1 完了
- [ ] Task 4-2 完了
- [ ] Task 4-3 完了
- [ ] Task 4-4 完了
- [ ] Task 4-5 完了

## 次Phase

Phase 5 で GREEN 実装を行う。
