# Phase 11: 手動 smoke — NON_VISUAL タスク

## 視覚的検証

本タスクは `visualEvidence: NON_VISUAL`（artifacts.json）。UI 変更を伴わないため、
スクリーンショットは取得不要。代替として in-memory D1 上で全 migration を適用したうえで
contract / repository テストを実行することで smoke を満たす。

## 自動 smoke 結果

- `apps/api` vitest 全件 PASS（68 files / 407 tests）
- `_setup.ts` が `apps/api/migrations/*.sql` を辞書順に流すため、0007 migration の DDL
  が in-memory D1 で実行可能であることを実証
- 新規追加テスト（state transition / 再申請 202）が PASS

詳細は `manual-smoke-log.md` / `link-checklist.md` を参照。
