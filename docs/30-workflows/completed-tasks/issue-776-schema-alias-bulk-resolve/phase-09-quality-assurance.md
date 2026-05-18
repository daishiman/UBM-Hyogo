# Phase 9: Quality Assurance / 受入条件確認

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 受入条件 (AC) 完全一覧

| # | AC | 検証手段 |
| --- | --- | --- |
| AC-1 | 複数 `unresolved` / `changed` diff を checkbox 選択 → batch confirm modal → 一括 resolve できる | Phase 11 evidence + spec |
| AC-2 | partial failure 時、成功分確定 / 失敗分のみ理由付き再操作可 | spec (`useSchemaDiffBulkSelection.spec.ts` 8番 / Modal partial failure) + evidence |
| AC-3 | 既存 single-resolve 経路が回帰なし | 既存 `SchemaDiffPanel.component.spec.tsx` 全件 green |
| AC-4 | stableKey validation regex は single 経路と単一定義（duplicate 禁止） | grep で regex 文字列が 1 箇所定義のみ |
| AC-5 | spec test に partial failure シナリオ含む | Phase 4 / 6 test ケース |
| AC-6 | design token 違反 0（OKLch のみ） | `verify-design-tokens` gate / 手動 grep `bg-\[#` / `#[0-9a-f]{3,6}` 直書き 0 |
| AC-7 | bulk endpoint を新設した場合 integration test 3 ケース | **本サイクルは API 不変条件1により新設しない → 該当なし**（index.md スコープ参照） |
| AC-8 | `specs/11-admin-management.md` に bulk resolve 仕様追記、step-03 single-resolve 仕様と整合 | Phase 12 docs |
| AC-9 | Phase 11 evidence: bulk select + batch modal + partial failure の desktop 1280 / mobile 375 screenshot | Phase 11 outputs |
| AC-10 | 親 workflow Phase 12 unassigned-task-detection §3 「alias bulk resolve」を consumed に更新 | Phase 12 で当該 md を編集 |
| AC-11 | `202 backfill_cpu_budget_exhausted` は bulk でも失敗扱いせず retryable continuation として残る | `api.spec.ts` + modal retryable row spec |

## 不変条件再確認

- [x] 既存 API endpoint surface のみ使用 (CLAUDE.md MVP recovery 不変条件1)
- [x] OKLch token のみ (不変条件3)
- [x] `*.spec.*` のみ (不変条件8)
- [x] D1 直接アクセス禁止
- [x] env access は `getEnv()` / `getPublicEnv()` 経由（本タスクで env 参照は無いが念のため）

## 計測 (NFR 検証)

- 30 件 bulk submit を local dev または branch preview で計測し、所要時間を Phase 11 evidence に記録。staging 計測は PR 後の runtime gate で再取得する。
- 30 秒以内 (NFR-5) を満たすか確認、満たさない場合は Phase 8 にフィードバック

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage --
mise exec -- pnpm --filter @ubm-hyogo/web build
bash scripts/verify-pr-ready.sh
```

## 完了条件
- [ ] AC-1〜AC-6 / AC-8〜AC-10 全件充足（AC-7 は scope 外明示）
- [ ] 不変条件 violation 0
- [ ] NFR-5 計測ログを Phase 11 に記録
