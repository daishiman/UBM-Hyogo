# Phase 8: リファクタリング

[実装区分: 実装仕様書]

## 目的

W2-W5 の実装で発生した重複・命名ドリフト・余剰抽象を整理する。

## 対象 / Before / After / 理由 (Feedback RT-03 形式)

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| (例) member summary | `IdentityConflictRow.tsx` 内に inline 定義 | 同ファイル内 named function に分離 (current 状態) | テスト容易性 |
| (例) action tone 関数 | `AuditLogPanel` 内の inline | 同ファイル内 named function | 単独テスト可 |
| (例) zod schema | `apps/web/src/lib/admin/api.ts` / API route-local schema | そのまま | 共通 type にしない (FB-W0-01: root barrel 衝突回避) |
| (例) `formatJstDate/Time` | 既存 helper を使用 | そのまま | 重複作成しない |

> 実装を始めてから具体的な refactor 候補を上表に追記する。本 phase 完了時に空表は許容しない (見直し作業の証跡を残す)。

## チェック項目

- HEX 直書きが intermediate commit に残っていないか
- 新規 barrel export を増やさず、既存 `apps/web/src/components/admin/*` import が成立していることを確認
- adapter 間で重複した zod fragment があれば共通化を検討 (ただし root `@repo/shared` への昇格は避ける — FB-W0-01)
- 不要な `"use client"` ディレクティブの除去 (`AuditLogPanel` 内で client 必須範囲を最小化)
- `console.log` / 残存 TODO / FIXME が無いことを確認

## 検証

```bash
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/web lint
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

## DoD

- [ ] refactor 表が埋まっている (空でない)
- [ ] typecheck / lint / test すべて green を維持
- [ ] 不要 `"use client"` / TODO / console.log が 0 件
