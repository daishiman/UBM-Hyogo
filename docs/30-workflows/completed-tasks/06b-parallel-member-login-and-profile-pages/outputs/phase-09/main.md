# Phase 09 outputs: 品質保証

## サマリ

型安全 / lint / unit / contract / E2E / a11y / secret hygiene の 7 種品質チェックと、Cloudflare 無料枠 0.43% 使用の見積、secret hygiene H-01〜H-06、a11y 7 観点、不変条件 #4 / #9 の static 担保（grep 0 件）を確定。Phase 10 GO/NO-GO の根拠を提供する。

## ステップ 1: 品質チェック

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | error 0 |
| lint | `pnpm lint` | error 0、`/no-access` リテラル / `localStorage` / `window.UBM` 禁止 |
| unit | `pnpm test --filter=apps/web` | U-01〜U-03 green |
| contract | 08a で実行 | C-01〜C-04 green |
| E2E | 08b で実行 | E-01〜E-10 desktop / mobile pass |
| a11y | axe via Playwright | violation 0 |
| secret scan | gitleaks | finding 0 |

## ステップ 2: 無料枠見積もり

| 操作 | 1 日想定回数 | 月間 | 無料枠 | 結論 |
| --- | --- | --- | --- | --- |
| `/login` 表示（RSC） | 200 | 6,000 | Workers 100k/日 | OK（0.2%） |
| `/login` Magic Link 送信 | 50 | 1,500 | Workers + Email Service | OK |
| `/login` Google OAuth | 30 | 900 | Workers | OK |
| `/profile` 表示（RSC + 04b /me + /me/profile） | 100 | 3,000 | Workers + 04b D1 reads | OK |
| middleware `/profile` redirect | 50 | 1,500 | Workers | OK |
| 合計 Workers req | 430 / 日 | 12,900 / 月 | 100,000 / 日 | OK（0.43%） |
| 合計 D1 reads（04b 経由） | 200 / 日 | 6,000 / 月 | 5,000,000 / 日 | OK |

## ステップ 3: secret hygiene

| # | チェック | 確認 | 期待 |
| --- | --- | --- | --- |
| H-01 | client component で AUTH_SECRET 等を参照しない | `grep -r "AUTH_SECRET" apps/web/app/login/_components apps/web/app/profile/_components` | 0 件 |
| H-02 | client は `NEXT_PUBLIC_*` のみ参照 | `grep -r "process.env" apps/web/app/login apps/web/app/profile` | `NEXT_PUBLIC_*` のみ |
| H-03 | `PUBLIC_API_BASE_URL` は public var | wrangler.toml | name のみ |
| H-04 | `AUTH_URL` は 05a/b 共有 var | wrangler.toml | name のみ |
| H-05 | `responderUrl` は spec 公開値 | `git grep "responderUrl"` | spec / page 内のみ |
| H-06 | Google OAuth client_id 等の実値は記載しない | `git grep -E "client_id\s*[:=]\s*\"\d"` | 0 件（placeholder のみ） |

## ステップ 4: a11y

| 観点 | 対応 |
| --- | --- |
| LoginPanel | h1 構造、Banner に `role="status"` / `role="alert"` |
| MagicLinkForm | `<label>` 連動、Tab 操作可、cooldown 時 `aria-disabled` |
| GoogleOAuthButton | `aria-label="Google でログイン"`、フォーカス可視 |
| StatusSummary | KVList が table semantics、状態に色だけでなくテキスト併用 |
| EditCta | button disabled 時 `aria-disabled` + tooltip、外部リンクに `rel="noopener noreferrer"` |
| ProfileFields | 見出し階層（h2 / h3）、stableKey ラベルを spec 表示名に変換 |
| AttendanceList | `<ul>` セマンティクス、空のときは `<EmptyState role="status">` |

## ステップ 5: 不変条件 #4 / #9 の static 担保

| 観点 | 検査コマンド | 期待 |
| --- | --- | --- |
| #4 profile 編集 form 不在 | `grep -r "<form" apps/web/app/profile` | 0 件 |
| #4 編集 button 不在 | `grep -rE "(onSubmit|onClick).*update|edit" apps/web/app/profile` | 0 件 |
| #9 `/no-access` 不採用 | `grep -r "/no-access" apps/web` | 0 件 |
| #9 `/login` で 5 状態を吸収 | `@typescript-eslint/switch-exhaustiveness-check` | error 0 |

## 不変条件チェック

- #1 / #4 / #5 / #6 / #8 / #9 / #10（0.43%） / #11 すべて定量化
