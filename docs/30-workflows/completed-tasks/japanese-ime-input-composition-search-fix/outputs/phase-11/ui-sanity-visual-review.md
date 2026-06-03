# Phase 11: UI sanity / visual review

## 宣言

- タスク種別: **VISUAL**。local screenshot は取得済み。実機 IME 操作 + staging 認証を要する IME composing screenshot のみ user-gated。
- 本サイクルでは local `/members` の baseline と keyword filter 状態を Playwright screenshot で確認した。

## 期待される視覚状態（実装 wave で確認）

| 画面 | 期待 |
| --- | --- |
| 検索入力（IME 変換中） | 未確定文字列が正しく合成表示され、URL（`?q=`）が更新されない |
| 検索入力（確定後） | debounce 後に確定文字列で検索結果・URL が更新される |
| クリア | ×アイコンは入力欄内の 1 箇所のみ。サマリーバーに `検索: …` チップが出ない |

## 取得済み screenshot

| ファイル | 判定 |
| --- | --- |
| `screenshots/member-search-local-overview.png` | PASS: baseline filter UI が schema/runtime error なしで表示される |
| `screenshots/member-search-local-keyword-filter.png` | PASS: `テスト` は入力欄に表示され、サマリーバーは zone chip のみ。`検索: テスト` chip は出ない |

## デザイントークン

OKLch トークン正本化を維持（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止）。新規色追加なし。
