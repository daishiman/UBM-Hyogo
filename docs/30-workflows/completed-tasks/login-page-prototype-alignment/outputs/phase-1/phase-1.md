# Phase 1: 要件定義 / スコープ確定 / 既存実装インベントリ

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/login-page-prototype-alignment/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `existing-route-alignment`（既存 `/login` route のプロトタイプ整合改修。新規 route 追加なし） |
| primary source | `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` (LoginPage L4-65), `docs/00-getting-started-manual/claude-design-prototype/styles.css` (L132-160 brand, L778-806 auth-shell/auth-card) |
| 現行実装 | `apps/web/app/login/` (page.tsx + _components/) |
| 状態 | `spec_created` |

## 1. 背景

`/login` route は task-13 06b で既に **状態遷移 (6 state) と magic-link / Google OAuth の機能実装が完了**している。一方で UI/UX レイアウトは task-13 当時に独自カード型 wrapper として実装されたままで、`docs/00-getting-started-manual/claude-design-prototype/` 配下の正本プロトタイプ (LoginPage コンポーネント) との視覚的整合が取れていない。

本ワークフローは **`/login` の機能 (状態遷移 / Auth.js 連携 / cooldown / D1 access boundary) を一切変更せず**、UI 表現のみをプロトタイプに完全整合させる alignment タスクである。

## 2. 現状コードインベントリ（実測）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/web/app/login/page.tsx` | Server Component。`parseLoginQuery` → `LoginCard` + `LoginPanel` を組み立て | `TITLES` の wording 更新（subtitle の文面差し替え）。layout 構造は維持 |
| `apps/web/app/login/_components/LoginCard.tsx` | Card wrapper。SVG (UBM 円形) + h1 + subtitle + children を `<Card>` で包む | **brand 部分を SVG → `brand-mark` + `brand-title (jp + en)` 2段構造へ全面差し替え**。`Card` の構造は維持 |
| `apps/web/app/login/_components/LoginPanel.client.tsx` | `state === "input"` 時に GoogleOAuthButton → MagicLinkForm → register link を順に描画 | **順序を MagicLinkForm → OR divider → GoogleOAuthButton → register link へ反転**。Banner / LoginStatus 分岐は維持 |
| `apps/web/app/login/_components/MagicLinkForm.client.tsx` | Field + Input + Button（cooldown ロジックあり） | **Input に `inputSize="lg"` / placeholder `you@example.com`、Button に `variant="primary" size="lg" block leftIcon={send icon}`、label を「マジックリンクを送る」に変更**。送信ロジックは無改変 |
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | Button text のみ | **`variant="ghost" size="lg" block leftIcon={google icon}` を追加し label を「Googleでログイン」に変更**。signIn 連携は無改変 |
| `apps/web/app/login/_components/LoginStatus.tsx` | state ≠ input の表示 | **sent state で 56px square inbox icon block + email 強調表示 + 戻るボタンをプロトタイプ準拠で再構成**。他 state (unregistered / deleted / rules_declined / error) はメッセージ整形のみ |
| `apps/web/src/components/ui/icons.ts` | `IconName` enum と SVG path（現在は `chevron-*` / `x` / `search` / `check` / `menu` / `external-link` の 7 つのみ） | **`send` / `google` / `inbox` / `arrow-left` の 4 icon を追加**（プロトタイプの `<Icon name="...">` 利用箇所と合わせるため） |
| `apps/web/src/components/ui/Button.tsx` | `variant` / `size` / `block` / `leftIcon` / `rightIcon` 既存対応 | **無改変**（プロトタイプ要件をすべて satisfy 済み） |
| `apps/web/src/components/ui/Input.tsx` | `inputSize: "sm" \| "md" \| "lg"` 対応 | **無改変** |
| `apps/web/src/components/ui/Field.tsx` | `label` / `required` 対応 | **無改変** |
| `apps/web/src/components/ui/Icon.tsx` | `IconName` を引数に SVG を render | **無改変**（`icons.ts` の enum 拡張に追随） |
| `apps/web/src/styles/tokens.css` | OKLch token 正本（`--ubm-color-*`） | **無改変**。`var(--ubm-color-accent)` / `var(--ubm-color-ok)` / `var(--ubm-color-ok-soft)` / `var(--ubm-color-border-default)` / `var(--ubm-color-text-muted)` 等を引用するのみ |
| `apps/web/src/styles/globals.css` または新規 `auth.css` | プロトタイプの `.auth-shell` / `.auth-card` / `.brand-mark` / `.brand-title` クラス | **`.auth-shell` / `.auth-card` / `.brand-mark` / `.brand-title` の 4 class を新規追加**（場所は Phase 2 で決定） |
| `apps/web/app/login/__tests__/error.component.spec.tsx` | error.tsx の spec | **無改変**（error.tsx 自体は touch しない） |
| `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | MagicLinkForm の振る舞い spec | **placeholder / button label のスナップショット更新のみ。送信フローは無改変** |

## 3. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `/login` の `state="input"` 時、プロトタイプ準拠の **brand block (brand-mark 兵 + brand-title (jp "UBM兵庫支部会" / en "Member Portal"))** を最上部に表示する |
| FR-2 | h1 ラベルを「会員ログイン」、subtitle を「Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。」とする |
| FR-3 | フォームを **(a) Field + Input(email, lg, placeholder="you@example.com") → (b) Button(variant=primary, size=lg, block, leftIcon=send, label="マジックリンクを送る") → (c) OR divider → (d) Button(variant=ghost, size=lg, block, leftIcon=google, label="Googleでログイン")** の順で描画する |
| FR-4 | フォーム下部に「会員でない方は <a href="/register">メンバー登録</a> から」を accent カラー linkで中央配置する |
| FR-5 | `state="sent"` 時、56px square (border-radius 16px, `--ubm-color-ok-soft` 背景 / `--ubm-color-ok` フォアグラウンド) の inbox icon block + h2「メールをご確認ください」+ 「<email> 宛に……」本文 + 「戻る」ghost button をプロトタイプ準拠で表示する |
| FR-6 | OR divider は両端の 1px hairline (`var(--ubm-color-border-default)`) + 中央の "OR" テキスト (uppercase / letter-spacing 0.12em / `--ubm-color-text-muted`) で構成する |
| FR-7 | ページ全体は `.auth-shell` full-page centered レイアウト（min-height 100vh, place-items center, background radial-gradient 装飾）で囲む |
| FR-8 | 既存の 6 state（input / sent / unregistered / deleted / rules_declined / error）すべてで auth-card 内に収まるレイアウトを維持する |
| FR-9 | 既存の searchParams 駆動状態遷移 / Auth.js 連携 / 60s cooldown / D1 直接アクセス禁止 / `/no-access` を使わない不変条件をすべて維持する |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | HEX 直書き禁止。色は `apps/web/src/styles/tokens.css` の `--ubm-color-*` 経由のみ。`bg-[#xxx]` / `text-[#xxx]` 直書きは CI gate `verify-design-tokens` で fail 判定 |
| NFR-2 | `apps/web` からの D1 直接アクセス禁止（既存 magic-link API proxy `/api/auth/magic-link` 経由のみ） |
| NFR-3 | 新規 API endpoint 追加禁止。既存 `apps/api/src/routes/` 配下の endpoint surface のみ利用 |
| NFR-4 | Server Component / Client Component の境界は現行構造を維持（`page.tsx` Server、`*.client.tsx` Client） |
| NFR-5 | a11y: form field の `label` 関連付け、`role="alert"` の error 配置、button の `aria-busy` を維持。h1 / h2 のヒエラルキーを崩さない |
| NFR-6 | 1 サイクル内完了（CONST_007）。プロトタイプ準拠の bare-bone 再現を完了し、Playwright visual regression baseline 更新と staging visual 観測は Phase 11 で取得する |
| NFR-7 | OpenNext Cloudflare Workers build で動作する範囲のみ（new Image / canvas / node-only API への依存を増やさない） |

## 5. 受け入れ基準（AC）

- AC-1: `view-source:http://localhost:3000/login` の HTML に `<div class="auth-shell">` と `<div class="auth-card">` が含まれる
- AC-2: `state="input"` で **MagicLinkForm が先、OR divider、GoogleOAuthButton が後** の DOM 順になる（Playwright `getByRole('button', { name: 'マジックリンクを送る' })` が GoogleOAuthButton より前に出現する）
- AC-3: brand 部分が SVG ではなく `.brand-mark` + `.brand-title > .jp + .en` の 3 要素構造で render される
- AC-4: send / google アイコンが Button 内に SVG として描画される（`getByRole('button').locator('svg')` で 1 件以上ヒット）
- AC-5: `state="sent"` で 56px square inbox icon block が描画され、email アドレスが `<b>` 強調で表示される
- AC-6: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` がすべて PASS
- AC-7: `verify-design-tokens` CI gate が HEX 直書き 0 件で PASS
- AC-8: 既存 `MagicLinkForm.component.spec.tsx` の cooldown / submit / error 系テストが（label 更新を除き）PASS
- AC-9: Playwright `/login` smoke が DOM 順序 + 文言を assert する形で PASS
- AC-10: Phase 11 で `outputs/phase-11/screenshots/login-input.png` / `login-sent.png` を取得し、プロトタイプとの視覚 diff を目視確認した記録を残す

## 6. スコープ確定

### 含む

- `apps/web/app/login/page.tsx` の TITLES wording 更新
- `apps/web/app/login/_components/LoginCard.tsx` の brand 構造書き換え
- `apps/web/app/login/_components/LoginPanel.client.tsx` の DOM 順序入れ替え + OR divider 挿入
- `apps/web/app/login/_components/MagicLinkForm.client.tsx` の placeholder / size / icon / label 整合
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` の variant / size / icon / label 整合
- `apps/web/app/login/_components/LoginStatus.tsx` の sent state 再構成
- `apps/web/src/components/ui/icons.ts` の IconName 拡張（send / google / inbox / arrow-left）
- `apps/web/src/components/ui/Icon.tsx` の SVG path 追加
- `apps/web/src/styles/` への `.auth-shell` / `.auth-card` / `.brand-mark` / `.brand-title` CSS rule 追加（globals.css か新規 auth.css かは Phase 2 で確定）
- 既存 spec の placeholder / label 文言更新
- Playwright `/login` smoke の DOM 順序 assert 追加
- Phase 11 visual evidence 取得（local screenshot 2 枚 = input / sent）

### 含まない（明示的に後回し / 別タスク）

- `/register` route のプロトタイプ整合（別タスク; member-form プロトタイプは別画面）
- `/profile` 等他の member route の整合
- design token 追加・既存 token 値の変更（`tokens.css` は read-only として参照）
- `apps/api` 側の変更（magic-link / Auth.js handler は touch しない）
- Auth.js session 制御 / cookie 設定 / OAuth scope の変更
- Cloudflare deploy / staging visual smoke 実行（Phase 13 user-gated）
- E2E 全 6 state の網羅 visual regression（input / sent の 2 state を MVP とし、残 4 state は次サイクル）

### 正本順位

1. `docs/30-workflows/login-page-prototype-alignment/SCOPE.md`（本ワークフロー root）と本仕様書
2. `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` LoginPage L4-65
3. `docs/00-getting-started-manual/claude-design-prototype/styles.css` L132-160 / L778-806
4. `docs/00-getting-started-manual/specs/13-mvp-auth.md`（機能 contract）
5. `apps/web/src/styles/tokens.css`（色責務）

## 7. 既存実装との差分サマリー（プロトタイプ → 現状）

| 観点 | プロトタイプ | 現状実装 | 差分 |
|---|---|---|---|
| ページ全体 layout | `.auth-shell` (full-page centered + radial gradient) > `.auth-card` (max-width 420px panel) | `<main>` + `<Card>` のみ | **`.auth-shell` ラッパー欠落** |
| ブランド表現 | `.brand-mark` (兵 文字 36px square) + `.brand-title` (jp 13px + en 11px uppercase) | SVG 円形 "UBM" 48px 1 要素 | **brand block 全面差分** |
| h1 文言 | "会員ログイン"（24px） | "UBM 兵庫支部会へログイン" | **wording 差分** |
| subtitle | "Googleフォームにご登録のメールアドレス宛に、ログイン用のマジックリンクをお送りします。" | "登録済みのメールアドレスでログインしてください。" | **wording 差分** |
| primary CTA | MagicLink Button (primary, lg, block, send icon) | MagicLink Button (default ghost, no icon) | **variant / size / icon / 順序 差分** |
| secondary CTA | Google Button (ghost, lg, block, google icon) | Google Button (default ghost, no icon) | **icon / size / 順序 差分** |
| CTA 順序 | MagicLink → OR → Google | Google → MagicLink | **順序逆転** |
| OR divider | 両側 1px hairline + "OR" uppercase | 無し | **欠落** |
| register link | accent color centered, "会員でない方は メンバー登録 から" | "未登録の方は 会員登録ページから新規登録" | **wording + 配置 差分** |
| sent state | 56px square inbox icon block + h2 + email 強調 + ghost 戻る | LoginStatus 汎用表示 | **構造差分** |

## 8. 実装モード判定の根拠

- `apps/web/app/login/` 配下に既存 route + Server/Client component が実在 → **`new` ではなく `existing-*-alignment`**（CONST/task-17 stale-topology gate に該当）
- 機能要件 (FR-9 不変条件) は無改変、UI 表現のみ差し替え → **`existing-route-alignment`** に正式分類
- `apps/web/src/components/ui/icons.ts` への 4 icon 追加は UI primitive 拡張だが、新 component 追加ではなく enum 拡張のみのため alignment スコープ内に含める

## 9. リスクと初期対策

| リスク | 影響 | 対策 |
|---|---|---|
| Icon 追加で `IconName` の breaking change を起こす | 他画面の Icon 利用が壊れる | union 拡張のみ。既存値は削除しない。`pnpm typecheck` で確認 |
| `.auth-shell` CSS が他画面（`/register` 等）に意図せず波及 | 他画面の layout 崩れ | class 名は `.auth-shell` / `.auth-card` のままだが、利用箇所は `/login` のみと grep gate で確認（Phase 2 で実コマンド規定） |
| OR divider を flex で組むと縦リズム崩壊 | Button 間隔が詰まる | `.stack` 等の縦リズムを保ったまま OR row を 1 行として組み込む CSS を Phase 2 で確定 |
| Sent state の 56px icon block の color token mapping ミス | a11y contrast 不足 | `--ubm-color-ok-soft` (背景) + `--ubm-color-ok` (foreground) の組合せで AA 確認、Phase 2 で contrast 検証 |
| MagicLinkForm の disabled / cooldown 表示と新 layout の整合崩れ | 60s 再送ガードが視覚的にわかりにくい | Button の loading prop と disabled 表示は維持。cooldown 中の label は既存挙動（"<n>s 後に再送可能"）を踏襲 |

## 10. Phase 1 完了条件

- [x] taskType / visualEvidence / implementation_mode を確定（実装 / VISUAL / existing-route-alignment）
- [x] 既存ファイル 13 件のインベントリと改修方針を明示
- [x] FR-1〜FR-9 / NFR-1〜NFR-7 / AC-1〜AC-10 を列挙
- [x] スコープの「含む」「含まない」を明示
- [x] 正本順位を確定
- [x] 既存 → プロトタイプの差分 10 項目を表化
- [x] 実装モードを `existing-route-alignment` と判定し根拠を記載
- [x] 初期リスク 5 件と対策を列挙
