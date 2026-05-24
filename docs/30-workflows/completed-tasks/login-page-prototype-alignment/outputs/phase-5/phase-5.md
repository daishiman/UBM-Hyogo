# Phase 5: 実装順序とマイルストーン

**[実装区分: 実装仕様書]**

Phase 4 で定義した 13 ファイルの実装順序を、依存グラフと並列実行可否で確定する。

## 1. 依存グラフ

```
Step 1: tokens 検証                (前提)
    ↓
Step 2: icons 追加 (2 files)        (独立)
    ↓
Step 3: auth.css 新規 + globals.css import   (独立)
    ↓
Step 4: primitives 確認・必要時の最小拡張 (Button)   (独立、Step 2 完了後)
    ↓
Step 5: LoginShell / OrDivider 新規 (2 files)        (Step 3 後)
    ↓
Step 6: LoginCard / LoginStatus 改修 (2 files)       (Step 2/3/5 後)
    ↓
Step 7: MagicLinkForm / GoogleOAuthButton 改修        (Step 4 後)
    ↓
Step 8: LoginPanel.client.tsx 改修 (順序入替 + OrDivider 挿入)   (Step 5/7 後)
    ↓
Step 9: page.tsx 改修 (LoginShell wrap + TITLES 文言)           (Step 5/6/8 後)
    ↓
Step 10: 静的検証 (typecheck / lint / build / grep-gate)
    ↓
Step 11: dev server で動作確認 (Phase 6)
```

## 2. 各 Step 完了条件

| Step | 完了条件 |
|------|----------|
| 1 | `rg -n '\\-\\-ubm-color-(accent\|accent-soft\|accent-ink\|ok\|ok-soft\|surface\|surface-1\|border\|text\|text-2\|text-3)' apps/web/src/styles/tokens.css` がすべて hit。欠落があれば Phase 4 §2 の注記に従い置換 |
| 2 | `IconName` union に 4 値が含まれる / Icon.tsx の switch（または map）に 4 path が追加され、`<Icon name="send" />` で SVG 描画される |
| 3 | `auth.css` が `@layer components` 配下に 6 class 群を含む / `globals.css` の最後に `@import "./auth.css";` がある |
| 4 | `Button` が `variant="primary" \| "ghost"` / `size="sm" \| "lg"` / `block` / `leftIcon` props をすべて受理する（既存実装の確認、未対応分は最小拡張） |
| 5 | LoginShell / OrDivider が `*.tsx` で export され、`__tests__` 仮配置不要だが import 解決が通る |
| 6 | LoginCard header 内が brand-mark + brand-title + h1 + subtitle になっている / LoginStatus sent state が inbox icon block 構造 |
| 7 | MagicLinkForm のボタンが `variant="primary" size="lg" block leftIcon="send"` / GoogleOAuthButton が `variant="ghost" size="lg" block leftIcon="google"` |
| 8 | LoginPanel input state の DOM 順序が MagicLinkForm → OrDivider → GoogleOAuthButton → p.login-register-cta |
| 9 | page.tsx が LoginShell でラップされ、TITLES.input が "会員ログイン" + 新 subtitle |
| 10 | `pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/web build` がすべて exit 0、`rg HEX` grep 0 件 |
| 11 | Phase 6 §2 のチェックリストが全項目 OK |

## 3. 並列実行可否

| 並列ペア | 実行可否 | 理由 |
|----------|----------|------|
| Step 2 と Step 3 | 並列可 | ファイル独立 (icons.* と styles/*) |
| Step 5 (LoginShell / OrDivider) と Step 6 | 並列可 | 新規 vs 既存改修で衝突なし |
| Step 7 (MagicLinkForm / GoogleOAuthButton) と Step 6 | 並列可 | LoginCard / LoginStatus とは別 file |
| Step 8 と Step 9 | **不可** | page.tsx が LoginPanel の最終形に依存（順序入替後の見た目確認） |

実装者が 1 名の場合は直列で十分。複数の場合は (Step 2, Step 3) → (Step 5, Step 6, Step 7) → Step 8 → Step 9 の 3 wave で並列実行可能。

## 4. マイルストーン

| MS | 内容 | 想定所要 |
|----|------|---------|
| M1 | 基盤整備 (Step 1-4) — tokens / icons / CSS / Button primitive | 30〜60 min |
| M2 | コンポーネント実装 (Step 5-7) | 60〜90 min |
| M3 | 結線 (Step 8-9) + 静的検証 (Step 10) | 30〜60 min |
| M4 | 動作確認 (Step 11) + Phase 6 / 7 受け入れ | 60 min |
| **合計** | | 3〜5 時間 |

CONST_007 (1 サイクル完了スコープ) OK。

## 5. 中断・再開ポイント

- M1 完了時に commit (`feat(login): tokens + icons + auth.css 整備`)
- M2 完了時に commit (`feat(login): primitives + shell + or-divider`)
- M3 完了時に commit (`feat(login): align panel order + prototype copy`)
- M4 (Phase 11 evidence 取得) は別 commit (`chore(login): phase-11 evidence`)

各 commit は単体で typecheck / lint / build が通る粒度に保つ。
