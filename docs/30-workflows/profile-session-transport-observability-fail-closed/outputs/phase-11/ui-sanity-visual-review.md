# Phase 11: UI サニティ / ビジュアルレビュー（NON_VISUAL 宣言）

## NON_VISUAL 宣言（FB WEEKGRD-03 準拠・冒頭明記）

| 項目 | 値 |
|------|------|
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更は fetch/transport 層のコードと構造化ログのみ。UI 表現（文言・色・レイアウト・DOM 構造・OKLch トークン）を一切変更しない。`/profile` のユーザー向け表示は既存 `session-error-display.ts`（dev 取込済）のまま不変 |
| 代替証跡 | focused tests（T1〜T5）+ staging 実機の `server_fetch_failed` ログ（`{transportKind, baseHost, status}`）。スクリーンショットは取得しない |

## ビジュアルレビュー対象の不在

本タスクには **ビジュアルレビュー対象が存在しない**。理由は以下のとおり。

- 追加するのは (a) `server_fetch_failed` ログの診断メタ（`transportKind`/`baseHost`）= 画面に出ない、(b) `resolveApiFetch` の fail-closed throw = 既存 error boundary（`apps/web/src/app/error.tsx`）が補足し表示は既存のまま、の 2 点のみ。
- ユーザー向けの文言・色・コンポーネント・レイアウトに差分がない。OKLch トークン（SSOT §6 不変条件 6）にも変更がない。
- したがって UI スナップショット / ビジュアル回帰 / アクセシビリティ視覚レビューの対象が無く、スクリーンショットは証跡価値を持たない。

## 代替サニティ（NON_VISUAL での健全性確認）

| 区分 | 確認 | 手段 | 状態 |
|------|------|------|------|
| 型・構造 | transport descriptor / error 診断メタ / ログ shape | focused tests T1〜T5（jsdom・fetch モック） | PASS（5 files / 70 tests） |
| 回帰 | 既存 UI 文言・分岐が不変 | 既存 authed/safe-fetch/transport spec の回帰ゼロ（AC-8） | PASS |
| トークン | HEX 直書き / `bg-[#...]` 新規焼き込みなし | 本タスクは UI 非接触ゆえ該当変更なし | n/a（UI 非接触） |
| localhost gate | 新規 localhost/8787/8888 リテラルなし | focused transport tests + no apps/api diff | PASS（src literal gate は最終検証で実行） |
| 実機 | transport 解決先（`baseHost`）が localhost でない | staging `wrangler tail`（MT-C） | pending（user-gated） |

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した。
- [x] ビジュアルレビュー対象の不在を根拠付きで記録した。
- [x] 代替サニティ（型・回帰・gate・実機ログ）を記録した。

## 成果物
- `outputs/phase-11/ui-sanity-visual-review.md`（本ファイル）

## 参照資料
- `phase-11.md` / `manual-test-result.md`
- `../../_shared-context.md` §6（不変条件 6 OKLch / NON_VISUAL）

## 統合テスト連携
ビジュアル対象が無いため、健全性は focused tests（T1〜T5）と staging 実機ログ（MT-A〜MT-D）で代替する。Phase 12 へ引き継ぐ。
