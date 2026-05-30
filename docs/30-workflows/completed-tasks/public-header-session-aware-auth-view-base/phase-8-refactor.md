# Phase 8 — リファクタリング

## 1. 重複・冗長削除

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| PublicHeader 内の auth CTA inline マークアップ | 個別 JSX | `renderAuthSlot(authView)` private helper（同ファイル内） | 3 分岐の局所化・テスト見通し向上 |
| `authView.kind` の文字列リテラル | 3 箇所散在 | `as const` literal type で型側に集約 | drift 防止 |

## 2. ナビゲーション drift チェック

- 既存 nav の `aria-current` ロジック: `currentPath` prop 受け取り箇所を変更しない。
- brand link `/` 動線: 変更なし。

## 3. 命名一貫性 再確認

| 項目 | 確認 |
|------|------|
| `data-role="auth-cta"` / `data-role="member-cta"` / `data-role="admin-cta"` | kebab-case literal で統一 |
| `data-auth-state` | `guest\|member\|admin` の 3 値のみ |
| ファイル | `resolveAuthView.ts` `getAuthView.ts` で camelCase + kebab-case と整合 |

## 4. 副作用なし保証

- `resolveAuthView` は pure（テストで `Object.freeze(session)` 入力でも動作することを TC-RAV-10 として任意追加）。

## 5. 完了条件

- [ ] `rg "guest\|member\|admin" apps/web/src/components/public/PublicHeader.tsx` で literal 直書きが `data-auth-state` 周辺のみに局所化
- [ ] private helper `renderAuthSlot()` 抽出後も全 20 テスト PASS
