# Phase 3: 設計レビュー

**[実装区分: 実装仕様書]**

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
|---|------|------|------|
| R1 | 既存 props 互換 | ✅ | `AdminSidebarProps` に変更なし。呼び出し側 (`(admin)/layout.tsx`) も無修正 |
| R2 | 既存 nav 全 12 項目の保持 | ✅ | Admin 9 / 会員ディレクトリ / 登録 / マイページの計 12 が GROUPS に残存 |
| R3 | DOM 契約の一意性 | ✅ | `data-role="public-return"` は新規追加のみ。既存 grep で 0 件確認済 |
| R4 | 案 A vs 案 B 選択 | ✅ 案 B 採用 | プリミティブ拡張は regression リスクが高く、差分最小化原則 (CLAUDE.md "Don't add features beyond what the task requires") に反する |
| R5 | OKLch トークン | ✅ | HEX 直書きなし。`var(--ubm-color-*)` 経由 |
| R6 | フォーカスリング / a11y | ✅ | `aria-label`, `<span aria-hidden>` で icon を non-semantic 化 |
| R7 | 既存「ホーム」削除の影響 | ✅ | 元の意味（公開トップへの動線）は「公開サイトに戻る」に承継。重複追加にならない |
| R8 | プロトタイプ整合 | ⚠ 後続確認 | `docs/00-getting-started-manual/claude-design-prototype/` に admin sidebar の該当配置が描かれているかは Phase 9 で再確認。プロトタイプにない場合も primitives + tokens 範囲内のため新規 primitive 増殖 (`invariant #3`) には抵触しない |
| R9 | CONST_007 1 サイクル完了性 | ✅ | 1 ファイル編集 + 1 spec 追記で完結。先送りなし |

## リスクと対策

| リスク | 対策 |
|--------|------|
| 既存 spec で「ホーム」ラベルを assert している | Phase 4 で spec を grep し、該当 assertion を「公開サイトに戻る」に更新（spec 側を要件に合わせる） |
| `<a>` 直書きで Next.js `<Link>` を使っていない | 公開トップへの遷移は SPA 内遷移ではあるが、admin → public は layout が切り替わるため full reload で問題なし。`<a href="/">` で十分。`<Link>` 化は Phase 8 で要否判定 |
| `data-role` を style hook と混同 | `data-role` は test anchor 専用と spec 上で明示。CSS は class 経由 |

## 完了条件

- 全観点 R1〜R9 が「✅」または「⚠ + 後続 Phase の補捉場所」で記録されている
- 案 B 採用が確定し、Phase 5 の差分粒度に反映されている
