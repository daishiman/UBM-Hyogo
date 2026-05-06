# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 前 Phase | 8 (リファクタ) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |

## 目的

typecheck / lint / test / coverage の全 gate を満たすことを確認する。

## 検証コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test --coverage
mise exec -- pnpm --filter @ubm/api test --coverage --reporter=verbose 2>&1 | tee outputs/phase-09/test-output.log
```

## カバレッジ判定

| ファイル | branch 目標 | line 目標 |
| --- | --- | --- |
| `apps/api/src/repository/notificationOutbox.ts` | ≥80% | ≥85% |
| `apps/api/src/services/notification/templates.ts` | ≥85% | ≥90% |
| `apps/api/src/services/notification/dispatcher.ts` | ≥80% | ≥85% |
| `apps/api/src/workflows/notificationDispatchTick.ts` | ≥80% | ≥85% |

下回った場合は Phase 4 マトリクスに戻ってケース追加。

## CI gate 整合

- `coverage-gate` job が PR 上で PASS することを確認（ローカル PASS だけでなく CI PASS 必須）
- `verify-indexes-up-to-date` gate に該当する skill index 変更がない場合スキップ

## 成果物

- `outputs/phase-09/main.md`（実行サマリ）
- `outputs/phase-09/test-output.log`
- `outputs/phase-09/coverage-summary.txt`

## 完了条件

- [ ] typecheck PASS
- [ ] lint PASS
- [ ] @ubm/api test 全 PASS
- [ ] 新規ファイル coverage が目標以上

## 次 Phase

次: 10 (最終レビュー)。

## 実行タスク

1. typecheck / lint / tests / coverage を実行する
2. 結果を evidence として保存する

## 参照資料

- `package.json`
- `apps/api/package.json`

## 統合テスト連携

Phase 4 / 7 の matrix と実行ログを突合する。
