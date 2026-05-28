# Phase 8 — リファクタ

[実装区分: 実装仕様書]

## 1. 重複削除チェック

- 公開状態 chip ロジック（`STATE_LABEL` map）が `MembersTable` と `MemberDrawer` で重複していないか確認。重複時は `MemberStateChip.tsx` に集約。
- mask email (`maskEmail`) を `lib/admin/mask-email.ts` に切り出し（`MembersTable` と `MemberDrawer` で共用なら）。本サイクルでは使用が 1 箇所のみなら切り出さない（YAGNI）。
- `useAdminMutation` の `path` / `method` 引数が複数箇所で同様であれば、`_members/mutations.ts` に集約検討。**ただし重複が 2 箇所以下なら inline 維持**。

## 2. dead export 除去

- `_members/index.ts` (barrel) で参照されない export を削除
- 旧 `STATE_LABEL` (`MembersTable.tsx` L21-26) が `MemberStateChip` に移行後、元定義を削除

## 3. navigation drift

`AdminPageHeader` の `breadcrumbs` 構造が `_shared/AdminBreadcrumb` の interface と一致しているか確認。drift があれば親 workflow と同期。

## 4. token drift

`verify-design-tokens` ローカル実行 → HEX 直書きが残っていないか最終確認。

```bash
mise exec -- pnpm verify:design-tokens
```

## 5. import パス整流

`apps/web/src/features/admin/components/_members/*.tsx` 内 import を `_shared/` barrel 経由に揃える。深いパス参照 (`../../components/ui/...`) は維持（既存方針）。
