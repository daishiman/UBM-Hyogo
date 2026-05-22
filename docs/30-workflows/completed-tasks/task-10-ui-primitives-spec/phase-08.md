# Phase 8: リファクタリング

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 8 |
| 名称 | リファクタリング |
| 依存Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7 |
| 次Phase | Phase 9 |

## 目的

GREEN を維持したまま重複 class、naming drift、export drift を整理する。

## 実行タスク

- Task 8-1: `cn()` 適用漏れを確認する。
- Task 8-2: PascalCase file naming と export naming を確認する。
- Task 8-3: direct import の利用を grep する。
- Task 8-4: refactor 後に test / typecheck を再実行する。
- Task 8-5: 結果を `outputs/phase-08/main.md` に保存する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 7 | `phase-07.md` | coverage |
| Phase 9 | `phase-09.md` | quality gate |
| current barrel | `apps/web/src/components/ui/index.ts` | export |

## 実行手順

1. `rg -n "@/components/ui/" apps/web/src` で direct import を確認する。
2. `rg -n "className=" apps/web/src/components/ui apps/web/src/lib/cn.ts` で `cn()` 適用漏れを確認する。
3. `pnpm --filter @ubm-hyogo/web test` と `pnpm --filter @ubm-hyogo/web typecheck` を実行する。

## 統合テスト連携

Phase 8 後も Phase 6 test GREEN と Phase 7 coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を維持する。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| 抽象化思考 | 共通化は重複削減に効く範囲に限定 |
| 逆説思考 | 抽象化しない方が読みやすい場合は据え置く |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| refactor result | `outputs/phase-08/main.md` |
| identifier grep | `outputs/phase-08/identifier-grep.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 8 main | `outputs/phase-08/main.md` |
| identifier grep | `outputs/phase-08/identifier-grep.txt` |

## 完了条件

- [ ] test GREEN を維持している。
- [ ] typecheck 0 error を維持している。
- [ ] export drift がない。
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を維持している。

## タスク100%実行確認【必須】

- [ ] Task 8-1 完了
- [ ] Task 8-2 完了
- [ ] Task 8-3 完了
- [ ] Task 8-4 完了
- [ ] Task 8-5 完了

## 次Phase

Phase 9 で quality gate を一括実行する。
