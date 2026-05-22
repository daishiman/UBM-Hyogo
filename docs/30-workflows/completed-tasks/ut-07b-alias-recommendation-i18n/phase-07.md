# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 名称 | カバレッジ確認 |
| スコープ | 変更行ピンポイント（広域 coverage は対象外） |

## 目的

変更行（`normalizeLabelForCompare` 本体 + `recommendAliases` の差し替え行）の line / branch カバレッジが 100% であることを実測する。

## 実行タスク

1. coverage モードで `aliasRecommendation.spec.ts` を実行する
2. `normalizeLabelForCompare` の line / branch を 100% で確認する
3. `recommendAliases` 差し替え行が複数 test で通過することを確認する
4. coverage 出力を `outputs/phase-07/coverage-report.md` に記録する

## 対象範囲

| ファイル | 対象 |
| --- | --- |
| `apps/api/src/services/aliasRecommendation.ts` | helper 全 1 行 + `recommendAliases` 内 normalize 適用箇所 |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --coverage --run src/services/aliasRecommendation.spec.ts
```

期待:
- `normalizeLabelForCompare` line coverage 100%
- branch coverage 100%（分岐なし）

## 参照資料

- `outputs/phase-06/expanded-test-result.md`
- `apps/api/vitest.config.ts`（coverage 設定）

## 統合テスト連携

- 広域 coverage 目標は本タスク対象外
- 変更行 100% を Phase 9 品質保証の前提条件として渡す

## 成果物

`outputs/phase-07/coverage-report.md` に対象範囲・実測値・コマンド出力抜粋を記録。

## 完了条件

- [ ] 変更行 line coverage 100%
- [ ] 変更行 branch coverage 100%
- [ ] 広域 coverage 目標が対象外と明記されている
- [ ] `outputs/phase-07/coverage-report.md` が存在する
