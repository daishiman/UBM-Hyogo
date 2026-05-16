# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | completed |

## 目的

実装後の動作保証に必要なテストケースを確定する。

## テスト戦略

| 種別 | 対象 | 期待 |
| --- | --- | --- |
| 既存 unit | `useAdminMutation.spec.tsx` | hook の 401/403/toast DI 契約が壊れていない |
| Root mount 証跡 | `apps/web/app/layout.tsx` diff/grep + build | `ToastProvider` import と JSX wrap、RSC/client boundary が成立 |
| Manual | dev server | admin route から mutation を発火 → toast UI が DOM に表示 |
| typecheck | 全体 | PASS |
| lint | 全体 | PASS |

## 既存テストの再実行

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
```

期待:
- 全テスト PASS
- console.warn output に `warnMissingToastProvider` を示す warn が出ない（**ただしテスト spec 側で provider を wrap 済みなら元から出ない**）

### 既存 spec の wrap 状態確認

`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` の test setup 内で
`ToastProvider` を render wrapper にしているか grep で確認:

```bash
grep -n "ToastProvider\|wrapper" apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx
```

- wrap 済 → spec の前提は不変、PASS のはず
- wrap なし → fallback (`warnMissingToastProvider`) が動作中。spec の前提は不変だが、現実コードでは provider 配置でようやく実 toast が動く

## Root mount 一次証跡

`useAdminMutation.spec.tsx` は既に provider / toaster DI を使うため、root layout mount の直接証跡にはしない。
本タスクの root mount 一次証跡は次の 3 点に固定する:

```bash
rg -n "ToastProvider" apps/web/app/layout.tsx
pnpm -F "@ubm-hyogo/web" build
pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
```

Server Component の `layout.spec.tsx` を追加して child render だけを見る test は provider mount を保証しないため採用しない。

## Manual smoke 手順

1. `mise exec -- pnpm -F "@ubm-hyogo/web" dev`
2. `http://localhost:3000/admin` にログイン後 navigate
3. 任意の admin mutation を発火（例: tag 編集等。serial-05 未着手の場合は skip 可）
4. または、開発者ツール console で `__forceToast?.()` 相当が無い場合は `useAdminMutation` consumer を 1 つ手動 trigger
5. toast UI が DOM に表示されることを目視

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-07/test-plan.md | 上記テスト戦略・実行コマンド・期待結果 |

## 完了条件

- [x] テスト種別の一覧が明示
- [x] 既存 spec の wrap 状態確認方法が記載
- [x] manual smoke の手順が明示

## 次 Phase

Phase 8: ドキュメント更新
