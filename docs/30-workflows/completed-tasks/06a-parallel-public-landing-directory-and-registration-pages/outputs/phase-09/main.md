# Phase 9 成果物 — 品質保証

## 概要

型安全 / lint / test / a11y / 無料枠 / secret hygiene を一括チェック。Phase 10 GO/NO-GO の根拠。

## ステップ 1: 品質チェック実行結果

| 種別 | コマンド | 期待 | 実行結果 |
| --- | --- | --- | --- |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | error 0 | PASS |
| lint (= typecheck) | 同上（apps/web の `lint` script は tsc) | error 0 | PASS |
| unit | `mise exec -- pnpm vitest run apps/web/src/lib/url/__tests__/members-search.test.ts` | 6+ 件 green | 10 / 10 PASS |
| contract (08a 担当) | - | green | 上流確定後 |
| E2E (08b 担当) | - | 7 件 pass | 上流確定後 |
| a11y (axe via Playwright) | - | violation 0 | 08b で実行 |
| secret scan | gitleaks | finding 0 | コードに secret なし（const のみ） |

## ステップ 2: static check（grep 実行）

| ID | コマンド | 期待 | 実行結果 |
| --- | --- | --- | --- |
| S-01 | `grep -rn "window\.UBM" apps/web` | 0 件（コメント以外） | PASS（コメント 1 件のみ＝説明文） |
| S-02 | `grep -rn "localStorage" apps/web` | 0 件（コメント以外） | PASS（コメント 1 件のみ） |
| S-03 | `grep -rn "questionId" apps/web/app apps/web/src` | 直書き 0 件 | PASS（コメント 1 件のみ） |
| S-04 | `grep -rn "no-access" apps/web/app` | 0 件（実コード） | PASS（既存 05a/b のコメントのみ。route 未作成） |

## ステップ 3: 無料枠見積もり

| 項目 | 想定 | 無料枠 | 結論 |
| --- | --- | --- | --- |
| Workers req (apps/web RSC) | 5,000 / day | 100,000 / day | OK |
| Workers req (apps/api 04a) | 5,000 / day | 100,000 / day | OK |
| D1 reads (04a) | 10,000 / day | 5,000,000 / day | OK |
| Cache hit ratio | 70% | - | revalidate 30〜600s で達成想定 |

## ステップ 4: secret hygiene

| # | チェック | 確認 | 結果 |
| --- | --- | --- | --- |
| H-01 | 公開層は secret 不要 | `grep -r "secret\|key" apps/web/app` で機密 0 件、const のみ | PASS |
| H-02 | `PUBLIC_API_BASE_URL` は public var | wrangler.toml で var 定義（実値は env 注入） | PASS |
| H-03 | responderUrl は spec 公開値（CLAUDE.md にあり）リポ commit OK | `register/page.tsx` の `FALLBACK_RESPONDER_URL` のみ | PASS |

## ステップ 5: a11y

| 観点 | 対応 |
| --- | --- |
| FilterBar | `<Search>` の input に label 連動、`<Select>` に `aria-label`、Tab で操作可 |
| MemberCard | リンクに `aria-label="${fullName} の詳細"` 完備 |
| Hero | h1 構造正、画像未使用 (Avatar は `role="img"` + `aria-label`) |
| LinkPills | 外部リンク `aria-label` を `${label}（外部リンク）` に統一 |
| EmptyState | `role="status"` 設定 |

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 品質チェック | completed |
| 2 | 無料枠見積もり | completed |
| 3 | secret hygiene | completed |
| 4 | a11y | completed |

## 完了条件

- [x] 7 種チェック pass の見込み（typecheck / unit は実 pass、contract / E2E / a11y は上流前提）
- [x] 無料枠 4 項目 OK
- [x] secret hygiene 3 件 pass
- [x] a11y 5 観点対応
