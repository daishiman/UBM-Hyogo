# Phase 7: テストカバレッジ確認

## メタ情報

| Phase | 値 |
| --- | --- |
| Phase番号 | 7 |
| 名称 | テストカバレッジ確認 |
| 依存Phase | Phase 5, Phase 6 |
| 次Phase | Phase 8 |

## 目的

UI primitive 統合範囲の coverage を実測し、未到達分岐を Phase 6 または Phase 8 へ戻す。

## 実行タスク

- Task 7-1: `pnpm --filter @ubm-hyogo/web test:coverage` を実行する。
- Task 7-2: `apps/web/src/components/ui/**` と `apps/web/src/lib/cn.ts` の数値を抽出する。
- Task 7-3: 未達分岐があれば test 追加か除外理由を記録する。
- Task 7-4: coverage 結果を `outputs/phase-07/coverage.txt` に保存する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 6 | `phase-06.md` | test expansion |
| package scripts | `apps/web/package.json` | `test:coverage` |
| Phase 8 | `phase-08.md` | refactor |

## 実行手順

```bash
pnpm --filter @ubm-hyogo/web test:coverage 2>&1 | tee outputs/phase-07/coverage.txt
```

## 統合テスト連携

coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を下限とする。task-local 目標は UI primitive Lines >=90%, Functions >=90%, Branches >=85%, Statements >=90% とする。

## 多角的チェック観点（AIが判断）

| 観点 | 内容 |
| --- | --- |
| 2軸思考 | workspace 下限と task-local 上振れ閾値を分離 |
| 論点思考 | 未到達が実用分岐か到達不能分岐か判定 |

## サブタスク管理

| サブタスク | 成果物 |
| --- | --- |
| coverage run | `outputs/phase-07/coverage.txt` |

## 成果物

| 成果物 | パス |
| --- | --- |
| coverage | `outputs/phase-07/coverage.txt` |

## 完了条件

- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80% を満たす。
- [ ] UI primitive Lines >=90%, Functions >=90%, Branches >=85%, Statements >=90% を満たす。
- [ ] 除外がある場合は理由を test file に記録している。

## タスク100%実行確認【必須】

- [ ] Task 7-1 完了
- [ ] Task 7-2 完了
- [ ] Task 7-3 完了
- [ ] Task 7-4 完了

## 次Phase

Phase 8 で重複と naming を整理する。
