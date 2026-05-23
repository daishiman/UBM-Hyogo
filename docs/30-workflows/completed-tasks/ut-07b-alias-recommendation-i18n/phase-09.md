# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 名称 | 品質保証 |
| ゲート種別 | 一括判定（typecheck / lint / test / link） |

## 目的

line budget・link 整合・mirror parity 相当の品質ゲートを通過させる。本タスクは apps/api 内のサービス層変更で `.claude/skills/` mirror 同期はないが、関連 reference 同期が Phase 12 で発生するため、ここでは pre-check のみ行う。

## 実行タスク

1. `pnpm install` で依存整合を確認する
2. `pnpm typecheck` を全パッケージで実行する
3. `pnpm lint` を全パッケージで実行する
4. 該当 spec test を `--run` で実行し 20 ケース PASS を確認する
5. `aliasRecommendation.ts` の総行数が 100 行以下であることを確認する
6. workflow 配下の相対リンクが全て解決することを確認する
7. Phase 12 で同期する spec / reference の対象 path を pre-listing する

## 一括判定コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

## 観点

| 観点 | チェック |
| --- | --- |
| line budget | `aliasRecommendation.ts` が 100 行以下（現状 74 行 → +5 行想定） |
| link | `phase-*.md` / `index.md` の相対リンクが全て解決 |
| docs 同期 | Phase 12 で同期する spec / reference の path を pre-listing |
| 不変条件 | response shape / DB schema / endpoint 不変 |

## 参照資料

- `outputs/phase-05/green-test-result.md`
- `outputs/phase-06/expanded-test-result.md`
- `outputs/phase-08/refactor-notes.md`

## 統合テスト連携

- 全コマンド exit 0 を Phase 10 最終レビューの前提条件として渡す

## 成果物

`outputs/phase-09/quality-result.md` に各観点の PASS / FAIL を記録。

## 完了条件

- [ ] 全コマンド exit 0
- [ ] 4 観点（line budget / link / docs 同期 / 不変条件）が PASS
- [ ] `outputs/phase-09/quality-result.md` が存在する
