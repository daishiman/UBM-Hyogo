# Phase 7: エラーハンドリング・エッジケース

**[実装区分: 実装仕様書]**

ハッピーパス以外の挙動を仕様として固定する。実装は既存 `MagicLinkForm.client.tsx` / `LoginPanel.client.tsx` / `LoginStatus.tsx` のロジックを最大限保ち、UI 表現のみ Phase 4 で再構成する。

## 1. Cooldown 中の挙動

| 入力 | 期待挙動 |
|------|---------|
| `cooldown > 0` 状態で再送信ボタンクリック | onSubmit 内 early return（既存ロジック維持）、UI 上はボタン disabled で物理的にクリック不可 |
| Tab keyboard で focus 移動 | disabled button は focusable から外す (`<button disabled>` ネイティブ挙動) |
| cooldown 中の Google ボタン | 独立、影響なし |

## 2. ネットワークエラー

| シナリオ | 期待挙動 |
|---------|---------|
| `/api/auth/magic-link` が 5xx | `MagicLinkForm` catch → `replaceLoginState("error", redirect, { error: message.slice(0, 200) })` で URL を `?state=error&error=...` に置換 → `router.refresh()` で Server Component 再評価 → `LoginPanel` が `error` state を Banner で表示 |
| `/api/auth/magic-link` が 4xx (unregistered email) | API が `{ state: "unregistered" }` を返す → `replaceLoginState("unregistered", redirect)` → unregistered state UI |
| API timeout / network failure | catch ルートで `err.message ?? "送信に失敗しました"` |
| Google OAuth `signIn` が reject | `GoogleOAuthButton` の `setBusy(false)` で button 復活、Auth.js が `/login?error=...` にリダイレクトするケースは既存 query parser がハンドル |

## 3. Email validation

- HTML5 `type="email"` + `required` が一次防衛 (Phase 4 §4.5 維持)
- form submit 前に空文字 / `@` 不在の場合は browser ネイティブ validation がブロック
- Server 側 (`/api/auth/magic-link` proxy) が形式不正を返した場合は §2 のエラー経路

## 4. OAuth redirect ループ防止

- `redirect` パラメータが `/login` 自体を指している場合 (loop 懸念): `parseLoginQuery` の `redirect` フィールド validator (既存) が `/login` を許容しない、または無条件にデフォルト `/` に正規化される（既存ロジックの確認のみ。Phase 4 で変更しない）
- 異 origin の `redirect` (`https://attacker.com/...`) は既存 validator が same-origin path のみ許容で reject

## 5. searchParams が無効・欠落

| 入力 | 期待挙動 |
|------|---------|
| query なし | `parseLoginQuery({})` が `state: "input"` にフォールス |
| `state=unknown_value` | `parseLoginQuery` が unknown state を `input` に正規化 |
| `email=...` 単独 (state 欠落) | state を input にフォールス、email は input field の初期値にはしない（プロトタイプ準拠で初期値は空） |
| `redirect=//external.com` | parseLoginQuery validator が `/` 始まりで same-origin のみ許容、それ以外は `/` に正規化 |

> 既存 `apps/web/src/lib/url/login-query.ts` の挙動を Phase 5 Step 1 で `__tests__` 経由で再確認するのみ（Phase 4 では本ファイルを変更しない）。

## 6. brand-mark が表示崩れ

- `--ubm-color-accent-soft` / `--ubm-color-accent-ink` が未定義の token の場合、brand-mark が透明な背景で表示される懸念
- Phase 5 Step 1 で必ず tokens.css の grep 確認 → 欠落時は最寄り token (例: `--ubm-color-accent` の alpha 12%) に置換
- 欠落時の挙動は §8 follow-up unassigned-task で記録

## 7. 印刷 / 高コントラストモード

- print stylesheet 対象外（auth.css は `@layer components` のみ、print media query は持たない）
- Windows High Contrast Mode 下では brand-mark の背景色が消える可能性があるが、文字 "兵" は forced-color で text として読まれるため致命傷ではない
- 障害として扱わない (MVP 範囲外)

## 8. Edge case の follow-up 候補

実装時に発見された場合、Phase 12 unassigned-task-detection に列挙:

- Google brand color 4-tone 正規版アイコンの導入
- print stylesheet
- forced-colors 対応
- 国際化 (i18n) — 現在はハードコード日本語のみ
- brand-mark を画像アセットに差し替え (UBM ロゴ画像)

これらは MVP スコープ外として spec 段階から明示し、Phase 13 §4 で follow-up issue 化する。

## 9. Accept criteria (Phase 7 範囲)

- [ ] cooldown / network error / unregistered / email validation の 4 経路すべてが Phase 4 で変更したコードでも壊れない（Phase 8 component spec で assertion）
- [ ] OAuth redirect 検証が既存挙動と一致
- [ ] searchParams fallback がプロトタイプの初期表示 (input state) と一致
- [ ] §8 候補が Phase 12 unassigned-task-detection に転記済み
