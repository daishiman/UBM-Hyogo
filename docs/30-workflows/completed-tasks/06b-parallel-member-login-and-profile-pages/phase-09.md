# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 8 (DRY 化) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |

## 目的

型安全 / lint / unit / contract / E2E / a11y / 無料枠 / secret hygiene を一括チェックし、Phase 10 GO/NO-GO の根拠を作る。特に「`/profile` に編集 form / button が一切出現しない（不変条件 #4）」と「`/no-access` 不採用（不変条件 #9）」を lint / static check で定量担保する。

## 実行タスク

1. 品質チェックリスト
2. 無料枠見積もり
3. secret hygiene
4. a11y
5. 不変条件 #4 / #9 の static 担保

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID |
| 必須 | outputs/phase-08/main.md | 命名統一 |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | a11y 基準 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | session / profile |

## 実行手順

### ステップ 1: 品質チェック

| 種別 | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | error 0 |
| lint | `pnpm lint` | error 0、`/no-access` リテラル / `localStorage` / `window.UBM` 禁止 |
| unit | `pnpm test --filter=apps/web` | U-01〜U-03 green |
| contract | 08a で実行 | C-01〜C-04 green |
| E2E | 08b で実行 | E-01〜E-10 desktop / mobile pass |
| a11y | axe via Playwright | violation 0 |
| secret scan | gitleaks | finding 0 |

### ステップ 2: 無料枠見積もり

| 操作 | 1 日想定回数 | 月間 | 無料枠 | 結論 |
| --- | --- | --- | --- | --- |
| `/login` 表示（RSC） | 200 | 6,000 | Workers 100k/日 | OK（0.2%） |
| `/login` Magic Link 送信 | 50 | 1,500 | Workers + Email Service | OK |
| `/login` Google OAuth | 30 | 900 | Workers | OK |
| `/profile` 表示（RSC + 04b /me + /me/profile） | 100 | 3,000 | Workers + 04b D1 reads | OK |
| middleware `/profile` redirect | 50 | 1,500 | Workers | OK |
| 合計 Workers req | 430 / 日 | 12,900 / 月 | 100,000 / 日 | OK（0.43%） |
| 合計 D1 reads（04b 経由） | 200 / 日 | 6,000 / 月 | 5,000,000 / 日 | OK |

### ステップ 3: secret hygiene

| # | チェック | 確認 | 期待 |
| --- | --- | --- | --- |
| H-01 | client component で AUTH_SECRET 等を参照しない | `grep -r "AUTH_SECRET" apps/web/app/login/_components apps/web/app/profile/_components` | 0 件 |
| H-02 | client は `NEXT_PUBLIC_*` のみ参照 | `grep -r "process.env" apps/web/app/login apps/web/app/profile` | `NEXT_PUBLIC_*` のみ |
| H-03 | `PUBLIC_API_BASE_URL` は public var（apps/api ベース URL） | wrangler.toml | name のみ |
| H-04 | `AUTH_URL` は 05a/b 共有 var | wrangler.toml | name のみ |
| H-05 | `responderUrl` は spec 公開値（CLAUDE.md にあり）リポ commit OK | `git grep "responderUrl"` | spec / page 内のみ |
| H-06 | Google OAuth client_id 等の実値は記載しない | `git grep -E "client_id\s*[:=]\s*\"\d"` | 0 件（placeholder のみ） |

### ステップ 4: a11y

| 観点 | 対応 |
| --- | --- |
| LoginPanel | h1 構造、Banner に `role="status"` / `role="alert"` |
| MagicLinkForm | `<label>` 連動、Tab 操作可、cooldown 時 `aria-disabled` |
| GoogleOAuthButton | `aria-label="Google でログイン"`、フォーカス可視 |
| StatusSummary | KVList が table semantics、状態に色だけでなくテキスト併用 |
| EditCta | button disabled 時 `aria-disabled` + tooltip、外部リンクに `rel="noopener noreferrer"` |
| ProfileFields | 見出し階層（h2 / h3）、stableKey ラベルを spec 表示名に変換 |
| AttendanceList | `<ul>` セマンティクス、空のときは `<EmptyState role="status">` |

### ステップ 5: 不変条件 #4 / #9 の static 担保

| 観点 | 検査コマンド | 期待 |
| --- | --- | --- |
| #4 profile 編集 form 不在 | `grep -r "<form" apps/web/app/profile` | 0 件（visibility-request / delete-request の confirm dialog は本タスクで配置せず） |
| #4 編集 button 不在 | `grep -rE "(onSubmit|onClick).*update|edit" apps/web/app/profile` | 0 件 |
| #9 `/no-access` 不採用 | `grep -r "/no-access" apps/web` | 0 件 |
| #9 `/login` で 5 状態を吸収 | switch case の網羅 lint（`@typescript-eslint/switch-exhaustiveness-check`） | error 0 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | GO/NO-GO の根拠 |
| 08a / 08b | C / E test の根拠 |
| 09a | staging deploy 前の品質 |
| Phase 12 | secret hygiene を skill-feedback-report に |

## 多角的チェック観点

- 不変条件 #1: AC-11 の lint pass（stableKey 直書き禁止）
- 不変条件 #4: ステップ 5 の grep 0 件で profile 編集 UI 不在を確定
- 不変条件 #5: lint で apps/web → D1 直接 import を error
- 不変条件 #6: `window.UBM` grep 0 / `localStorage` grep 0
- 不変条件 #8: density / sort 相当ではないが、`/login` の URL state が localStorage に退避されないことを lint で担保
- 不変条件 #9: ステップ 5 で `/no-access` 文字列リテラル 0 件
- 不変条件 #10: 無料枠 0.43% 程度 → OK
- 不変条件 #11: profile に他人本文編集の経路もないことを再確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 品質チェック 7 種 | 9 | pending | typecheck / lint / unit / contract / E2E / a11y / secret |
| 2 | 無料枠見積もり | 9 | pending | 5 操作 + 合計 |
| 3 | secret hygiene | 9 | pending | H-01〜H-06 |
| 4 | a11y | 9 | pending | 7 観点 |
| 5 | 不変条件 static 担保 | 9 | pending | #4 / #9 grep 0 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質 + 無料枠 + secret + a11y + static |
| メタ | artifacts.json | phase 9 status |

## 完了条件

- [ ] 7 種チェック pass の見込み
- [ ] 無料枠 0.43% 以下 OK
- [ ] secret hygiene 6 件 pass
- [ ] a11y 7 観点対応
- [ ] 不変条件 #4 / #9 の static 担保 0 件

## タスク100%実行確認【必須】

- 全 5 サブタスクが completed
- outputs/phase-09/main.md 配置
- 不変条件 #1, #4, #5, #6, #8, #9, #10, #11 への対応が定量化
- 次 Phase へ GO / NO-GO 入力を渡す

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: blocker / minor / pass の集計、不変条件 #4 / #9 担保の証跡
- ブロック条件: 不変条件 #4 / #9 の grep が 1 件でも残れば進まない
