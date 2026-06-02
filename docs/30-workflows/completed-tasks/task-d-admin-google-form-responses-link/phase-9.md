# Phase 9: 品質保証

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象: admin サイドバー nav への Google Form 回答編集 外部リンク追加（dev landed / 親 PR #1064 / commit 745c95115）

## 目的

landed 実装が型・lint・テスト・デザイントークン gate・不変条件・アクセシビリティの各品質基準を満たすことを
コマンドと観点で固定する。本サイクルは verify_existing のため、各ゲートは green 状態の正本記述である。

## 品質ゲート表

| 観点 | コマンド | 期待 |
| --- | --- | --- |
| 型（網羅型 `PATHS` / `external?`） | `mise exec -- pnpm typecheck` | exit 0。`ShellNavItemId` に `"form-responses"` を足したことで `PATHS: Record<ShellNavItemId, string>` が path を要求し、`icons.tsx` 追加で網羅。`external?` は optional で既存項目の型互換を破らない |
| lint（boundaries / inline style） | `mise exec -- pnpm lint` | exit 0。`apps/web/src` の `no-restricted-globals` / import boundaries 違反なし。inline `style` 不使用 |
| 定数 spec | `mise exec -- pnpm exec vitest run apps/web/src/lib/constants/__tests__/form-responses.spec.ts` | green。`FORM_RESPONSES_EDIT_URL` が `.../edit` で終わり formId を含む |
| 描画 spec | `mise exec -- pnpm exec vitest run apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | green。external 項目が `<a target="_blank" rel="noopener noreferrer">` で描画され、`data-active`/`aria-current` を出さず、`↗`+sr-only「（外部リンク）」を持つ。内部項目の active 回帰なし |
| nav config spec | `mise exec -- pnpm exec vitest run apps/web/src/components/shell/__tests__/shell-config.spec.ts` | green。`buildNavForRole("admin")` の admin group に `form-responses`（href=定数 / label「Form回答」/ external=true）が含まれる |
| デザイントークン（OKLch / HEX 禁止） | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | exit 0。HEX 直書き・`bg-[#xxx]`・`text-[#xxx]` なし。className は OKLch トークン変数のみ |

## 不変条件 適合

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #7（MVP では Google Form 再回答を本人更新の正式経路） | OK | admin が Form 回答編集画面へ遷移する導線。`target="_blank"` + `rel="noopener noreferrer"` で安全に別タブ遷移し、`window.opener` を遮断 |
| #8（新規 test は `*.spec.{ts,tsx}` のみ） | OK | 3 spec すべて `*.spec.ts` / `*.spec.tsx`。`*.test.*` なし（lefthook `block-test-suffix` / CI `verify-test-suffix` を通過） |
| #9（admin form input は `FormField` 経由 / 直接 `<input>` 増設禁止） | 非該当 | 本変更は nav リンク追加であり form input を増設しない。`<input>` を一切追加していない |
| UI invariant #2（OKLch 正本化 / HEX 禁止） | OK | `verify-design-tokens` gate を通過。HEX・arbitrary color 値なし |
| UI invariant #3（新規 primitive を生やさない） | OK | 既存 `<a>`/`ShellIcon`/`Chip`/トークン再利用のみ |

## アクセシビリティ検証

| 項目 | 期待 | 実装根拠 |
| --- | --- | --- |
| 外部遷移の視覚告知 | `↗` を非 collapsed 時に表示（`aria-hidden="true"`） | `item.external && !collapsed` 分岐で `<span aria-hidden="true">↗</span>` |
| 外部遷移の支援技術告知 | sr-only「（外部リンク）」で screen reader に外部遷移を伝える | label 直後に `<span className="sr-only">（外部リンク）</span>` |
| active 誤認防止 | external 項目は `aria-current` を出さない | 外部 `<a>` 分岐で `aria-current`/`data-active` を付与しない（内部 `<Link>` のみ active） |
| 新規タブの安全性 | `rel="noopener noreferrer"` | tabnabbing 防止・referrer 抑制 |
| collapsed 整合 | collapsed 時は label/`↗` を非表示（icon のみ） | label を `sr-only`、`↗` は `!collapsed` 条件で非描画 |

## DoD（Definition of Done）

- [x] `typecheck` exit 0（網羅型 / `external?` 互換）
- [x] `lint` exit 0（boundaries / inline style なし）
- [x] 3 spec すべて green
- [x] `verify-design-tokens` exit 0（OKLch のみ・HEX 禁止）
- [x] 不変条件 #7 / #8 / #9 に適合
- [x] a11y（sr-only + aria-hidden ↗ + external は aria-current 非出力）を満たす

## 完了条件

完了条件は、品質ゲート表の全コマンドが期待結果（exit 0 / green）となり、不変条件 #7・#8・#9 と
アクセシビリティ要件を満たしていることが確認できた状態とする。screenshot は staging 認証必須のため
本フェーズでは取得せず（user-gated）、jsdom render unit と純関数 unit を主証跡とする。
