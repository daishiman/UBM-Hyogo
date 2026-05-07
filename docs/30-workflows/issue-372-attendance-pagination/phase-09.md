# Phase 9: 品質保証

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-9/phase-9.md` |

## 目的
全 quality gate を一気通貫で走らせ、commit / PR 直前の状態にする。

## 実行コマンド
```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test:run
mise exec -- pnpm --filter @ubm-hyogo/web test:run
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
mise exec -- pnpm build
```

## 参照資料
- `outputs/phase-9/phase-9.md`
- `outputs/phase-7/coverage-summary.md`

## 成果物
- `outputs/phase-9/typecheck.log`
- `outputs/phase-9/lint.log`
- `outputs/phase-9/test.log`
- `outputs/phase-9/coverage.log`
- `outputs/phase-9/build.log`

## 完了条件
- 全コマンド exit 0。
- log は evidence として保存。

## 実行タスク
- [ ] 全コマンドを順次実行し log を保存する。
- [ ] FAIL があれば該当 Phase に戻して修正する。

## 統合テスト連携
- Phase 11 の手動実機検証前の最終ローカル gate。
