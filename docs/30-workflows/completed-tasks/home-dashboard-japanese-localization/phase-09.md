# Phase 9 — 品質保証（トークン監査・gate 緑維持・budget/link/parity）

> 本 Phase は `_shared-context.md`（SSOT）§2 不変条件 #4・§4 DoD を正本として参照する。

## 目的

本タスクの全変更（実装 6 ファイル + テスト 4 ファイル）が品質ゲートを緑に保つことを保証する。
特に CSS 変更が「削除のみ・色追加 0・HEX 直書き 0」であることを監査し、`verify-design-tokens` 緑維持を担保する。
line budget / link / mirror parity の観点も併せて確認する。

## 成果物

### トークン監査
`outputs/phase-09/token-audit.md` に次を記録する（本書の正本）:
- CSS（F6）は **dead rule 4 件の削除 + CTA heading の `margin-top` を 0 にする値変更のみ**。
- **色の追加 0**（新規 `var(--ubm-color-*)` 参照なし・既存ルール削除のみ）。
- **HEX 直書き 0**（`#xxx` / `bg-[#xxx]` / `text-[#xxx]` の新規導入なし）。
- OKLch トークン正本（`tokens.css` / `design-tokens.md`）への変更なし。
- `verify-design-tokens`（HEX 0 gate）が緑を維持すること。

### 品質ゲート（SSOT §4）
| gate | 期待 |
| --- | --- |
| `pnpm typecheck` | 緑 |
| `pnpm lint` | 緑 |
| `verify:design-tokens`（または verify-design-tokens 相当） | 緑（HEX 0 / 色追加 0） |
| focused vitest（SSOT §4-1） | 4 spec + page.spec 全 PASS |
| 英語残存 grep（SSOT §4-4） | ヒット 0 |
| `git diff dev -- apps/api packages/shared` | 空 |

### budget / link / parity 観点
- **line budget**: 本タスクは文字列置換・要素削除・CSS 削除中心で、行数は純減〜微増（テスト追加分のみ）。大幅な肥大はない。
- **link**: 本 workflow 内の各 phase-NN.md / outputs リンクが解決すること（mirror / index 整合は close-out 時に確認）。
- **mirror parity**: implemented_local_evidence_captured のため local implementation evidence を取得済み。Phase 11 evidence inventory は local PASS（PNG 3 + DOM verification PASS）で記録する（SSOT §5）。

### 関連成果物
- `outputs/phase-09/main.md` — 品質保証方針・gate 一覧・implemented_local_evidence_captured の扱い。

## 統合テスト連携

- SSOT §4 の全コマンド（vitest / typecheck / lint / verify-design-tokens / 英語残存 grep / api diff）を QA チェックリストとして集約する。
- CSS は jsdom 非評価のため、`verify-design-tokens` は構文・トークン参照レベルで検証し、視覚崩れは Phase 11（user-gated）で確認する。
- implemented_local_evidence_captured のため、実コマンド実行・実スクショ取得はローカル実装後（staging/PR 承認後）（user-gated）。本 Phase は QA 計画と監査基準の確定までを担う。

## 完了条件

- [ ] `token-audit.md` に「CSS は削除のみ・色追加 0・HEX 直書き 0」が記録されている
- [ ] `verify-design-tokens` 緑維持の保証（HEX 0 / 色追加 0）が明記されている
- [ ] OKLch トークン正本（不変条件 #4）への変更が無いことが確認されている
- [ ] SSOT §4 の全 gate（typecheck/lint/vitest/verify-design-tokens/英語残存 grep/api diff）が QA チェックリストとして集約されている
- [ ] line budget が純減〜微増である観点が記録されている
- [x] implemented_local_evidence_captured のためローカル実行・スクショを取得済みであり、Phase 11 evidence は local PASS として扱う旨が確認されている
