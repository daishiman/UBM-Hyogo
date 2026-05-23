# Phase 6: 動作確認・ローカル検証

**[実装区分: 実装仕様書]**

実装後、ローカル dev server 上で全 state を目視確認するための手順書。

## 1. dev server 起動

```bash
# ターミナル A: dev server
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000 (Next.js dev server)

# ターミナル B: 任意で typecheck watch
mise exec -- pnpm typecheck --watch
```

`apps/web/wrangler.toml` の `[vars]` に依存する env が必要な場合、`apps/web/.dev.vars` (op 参照) が読み込まれること。dev server 起動エラーが env 由来の場合は CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い `bash scripts/cf.sh` 経由を検討する。

## 2. State 別チェックリスト

### 2.1 `?state=input` (デフォルト) — http://localhost:3000/login

- [ ] **レイアウト**: 画面中央に Card が配置 (auth-shell の `place-items: center` 効いている)
- [ ] **brand mark**: 左上に 40×40 px の角丸ボックス内に "兵" 文字 (accent-soft 背景・accent-ink 文字色)
- [ ] **brand-title**: brand-mark の右に "UBM兵庫支部会" (太字) ＋ "MEMBER PORTAL" (英大文字 letter-spacing)
- [ ] **h1**: "会員ログイン" (24px)
- [ ] **subtitle (p)**: "Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。"
- [ ] **Email Field**: label "メールアドレス"、placeholder "you@example.com"、type="email"
- [ ] **Primary Button (上)**: 全幅 (block)、size=lg、send アイコン左、ラベル "マジックリンクを送る"、accent カラー塗り
- [ ] **OR Divider**: 両端 1px hairline + 中央 "OR" (小文字 letter-spacing、text-3 カラー)
- [ ] **Ghost Button (下)**: 全幅 (block)、size=lg、google アイコン左、ラベル "Googleでログイン"、薄ボーダー・透明背景
- [ ] **Footer リンク**: 中央寄せ "会員でない方は メンバー登録 から"、"メンバー登録" 部分のみ accent カラー

### 2.2 `?state=sent&email=test@example.com&redirect=/` (Magic Link 送信成功)

- [ ] h1 が "メールをご確認ください"
- [ ] 上部に 56×56 px 角丸 16 の inbox アイコンブロック (ok-soft 背景・ok カラー)
- [ ] h2 と説明文中の `<strong>test@example.com</strong>` が太字表示
- [ ] 戻るボタン (size=sm, ghost, arrow-left icon) が下部に配置

### 2.3 `?state=error&error=送信に失敗しました`

- [ ] Banner (tone=danger) が表示され、メッセージ反映
- [ ] h1 が "ログインに失敗しました"

### 2.4 `?state=unregistered` / `?state=deleted` / `?state=rules_declined`

- [ ] それぞれ TITLES に対応する h1 が表示
- [ ] Banner / Status section の文言が既存仕様 (LoginStatus) と一致

### 2.5 `?gate=admin_required` (input 内 Banner)

- [ ] input state UI の最上部に warning Banner "管理者権限が必要です" が表示

## 3. レスポンシブ確認

| viewport | 確認項目 |
|----------|---------|
| Mobile 375×812 (Chrome DevTools iPhone 12) | Card が画面幅から 16px 余白を保ち、ボタンが横はみ出ししない、brand-title が改行されない |
| Tablet 768×1024 | Card max-width 440px のままセンタリング |
| Desktop 1440×900 | 画面全体のバランスが取れている、auth-shell の vertical centering が機能 |

## 4. OKLch token 反映確認

Chrome DevTools の Elements パネルで `.auth-card` の Computed styles を確認:

- `background` が `var(--ubm-color-surface)` を resolve し、`oklch(...)` 形式で表示される
- `.brand-mark` の `background` が `var(--ubm-color-accent-soft)` → `oklch(...)` 表示
- `border` が `var(--ubm-color-border)` → `oklch(...)` 表示

HEX 形式 (`#xxxxxx`) で表示されている箇所がある場合 → token 経由していないので auth.css を再確認。

## 5. a11y 確認 (manual)

- [ ] Tab キーで focus 順序: email input → Primary button → Google ghost button → register link → 戻る (sent 時)
- [ ] focus ring が visible (`outline` または `box-shadow` で 2px 程度)
- [ ] email input ラベルが label 要素として関連付け (Field component の id 連携)
- [ ] OR divider が screen reader で "または" と読まれる (aria-label)
- [ ] brand-mark の "兵" が aria-hidden で読まれない (装飾扱い)
- [ ] Banner が role="alert" 相当で読み上げ可能 (既存 Banner 仕様に準拠)

Lighthouse a11y スコア (DevTools → Lighthouse) で 95+ を期待。

## 6. ネットワーク確認

- [ ] Magic Link 送信ボタンクリック → DevTools Network で `/api/auth/magic-link` (proxy) への POST が発火
- [ ] 成功時 URL が `?state=sent&redirect=...` に置換され email クエリが落ちる (privacy)
- [ ] Google ボタンクリック → Auth.js `signIn("google", {...})` が発火 (NextAuth provider 経由)

## 7. 既存機能の non-regression

| 既存挙動 | 確認 |
|----------|------|
| 60s cooldown | 送信成功後ボタンが `${n}s 後に再送可能` 表示で disabled |
| searchParams 駆動 | URL 直接打ちで state 切替が動く |
| error 表示 200 char 制限 | 長文 error クエリが切り詰められる |
| Server Component SSR | View source で初期 HTML に brand-mark / h1 / form が含まれる |

## 8. 完了条件

§2〜§7 のチェックリストすべて OK で Phase 6 を完了とする。1 件でも NG があれば該当 Step (Phase 5) へ戻る。
