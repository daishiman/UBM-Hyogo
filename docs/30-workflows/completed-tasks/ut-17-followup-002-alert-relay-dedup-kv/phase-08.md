# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## 目的

Phase 5-7 で Green になった実装を最小限のリファクタで整える。重複・命名ドリフトのみを対象とし、機能変更は加えない。

## 候補

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| dedup key 生成 | 直書き文字列結合 | 既存パターンを維持（変更不要） | 既存実装と整合 |
| `dedupeTtlMs` → 秒換算 | handler 内 inline | 必要なら module-local const に出す（任意） | 可読性。リスクなければ skip |
| KV stub helper | `test/helpers/kv-stub.ts` | 既存 helper との命名整合確認 | 命名ドリフト防止 |

## 禁止事項

- KV 経由 dedup のロジック変更
- 既存テストの期待値変更
- 新規 abstraction の導入（CONST_007: 過剰な抽象化禁止）

## 実行コマンド

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint && mise exec -- pnpm --filter @repo/api test
```

## 完了条件

- [ ] 上記コマンドが全 PASS
- [ ] `outputs/phase-08/refactor.md` に Before/After/理由 のテーブルが記載（変更なしの場合も「変更なし」の旨を記録）
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 8
- status: completed

## 目的

不要な複雑化を避け、実装を整理する。

## 実行タスク

- helper 命名と inline 判断を確認する。

## 参照資料

- `outputs/phase-08/refactor.md`

## 成果物/実行手順

- `outputs/phase-08/refactor.md`

## 完了条件

- [x] refactor 判断が記録されている

## 統合テスト連携

- refactor 後も focused test を維持する。
