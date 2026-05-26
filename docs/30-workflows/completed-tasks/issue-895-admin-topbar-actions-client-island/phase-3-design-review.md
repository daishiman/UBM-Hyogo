# Phase 3 — 設計レビュー

## 3.1 不変条件チェック

| 不変条件 | 評価 |
|----------|------|
| INV-1: 新規 UI primitive 追加禁止 | ✅ 既存 `Button` / `SignOutButton` 流用のみ |
| INV-2: OKLch トークン正本化（HEX 禁止） | ✅ wrapper は layout utility（`flex items-center gap-2`）のみ、色は Button primitive 経由 |
| INV-3: 新規 API / D1 直アクセス禁止 | ✅ `signOut()` は既存 next-auth 経路のみ |
| INV-4: AdminTopbar primitive 改変禁止 | ✅ slot 契約をそのまま使用、primitive 改変なし |
| INV-5: layout.tsx を client 化しない | ✅ `(admin)/layout.tsx` は async server のまま |

## 3.2 リスク評価

| リスク | 影響 | 対策 |
|--------|------|------|
| AdminTopbar の `aria-hidden` 解除を spec で検出できない | a11y 回帰 | spec で `aria-hidden` 属性非保持 + button accessible name を assert |
| 後続が AdminTopbar 自体を client 化してしまう | 認証ガード崩壊 | component 冒頭コメントで明示 + Phase 8 リファクタ NG リスト記載 |
| topbar に「members 新規追加」等ページ固有操作が紛れる | 責務境界破綻 | spec で「ページ固有操作ラベル不在」を assert（回帰防止 assert） |
| `SignOutButton` の visual サイズ調整必要性 | UX 軽微 | `size="sm"` `variant="ghost"` で MVP 暫定。visual smoke で確認 |

## 3.3 代替案検討

| 案 | 採否 | 理由 |
|----|------|------|
| AdminTopbar を client 化して内部で SignOutButton を直接呼ぶ | ❌ | Server Component 境界が壊れ、認証ガードと干渉 |
| ログアウトボタンを各 admin page の AdminPageHeader.actions に置く | ❌ | グローバル操作とページ固有操作が混在し責務境界が崩れる |
| AdminTopbarActions を server component にして children に SignOutButton 渡す | ❌ | 中間 wrapper を増やすだけで意味なし。直接 client island で十分 |
| 採用案: AdminTopbarActions を client island 化し layout.tsx で注入 | ✅ | 親 followup-001 §4.4 の設計方針と完全整合、最小差分 |

## 3.4 レビュー結論

設計承認。Phase 4（テスト計画）へ進む。
