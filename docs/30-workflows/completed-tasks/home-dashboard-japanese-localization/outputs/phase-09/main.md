# Phase 9 outputs — 品質保証の詳細

> SSOT: `../../_shared-context.md` §2-4 / §4 / §5。

## 品質ゲート一覧（SSOT §4）

| gate | コマンド | 期待 |
| --- | --- | --- |
| 型チェック | `mise exec -- pnpm typecheck` | 緑 |
| lint | `mise exec -- pnpm lint` | 緑 |
| デザイントークン | `mise exec -- pnpm verify:design-tokens` | 緑（HEX 0 / 色追加 0） |
| focused vitest | SSOT §4-1 のフルパス指定 | 4 spec + page.spec 全 PASS |
| 英語残存 grep | SSOT §4-4 | ヒット 0 |
| API 非接触 | `git diff dev -- apps/api packages/shared` | 空 |

## トークン監査（要約）

詳細は `token-audit.md`。要点:
- CSS（F6）は dead rule 4 件の削除 + CTA heading `margin-top` を 0 にする値変更のみ。
- 色の追加 0 / HEX 直書き 0 / OKLch トークン正本（不変条件 #4）への変更なし。
- `verify-design-tokens` 緑維持。

## budget / link / parity

- **line budget**: 文字列置換・要素削除・CSS 削除中心で行数は純減〜微増（テスト追加分のみ）。肥大なし。
- **link**: 本 workflow の phase-NN.md / outputs リンク解決を close-out 時に確認。
- **mirror parity**: implemented_local_evidence_captured のため local implementation evidence を取得済み。Phase 11 evidence inventory は local PASS（PNG 3 + DOM verification PASS）。

## implemented_local_evidence_captured の扱い（SSOT §5）

- 本タスクは VISUAL（見た目が変わる）だが workflow_state=implemented_local_evidence_captured（ローカル実装・証跡取得済み）。Phase 11 capture は `local_fullpage_present_staging_pending`。
- 実スクショ取得・staging 反映・実コマンド実行はローカル実装後（staging/PR 承認後）（user-gated）。
- 本 Phase は QA 計画・監査基準の確定までを担い、実行そのものは行わない。

## QA チェックリスト（DoD 連携）

- [ ] typecheck / lint 緑
- [ ] verify-design-tokens 緑（HEX 0 / 色追加 0）
- [ ] focused vitest 全 PASS
- [ ] 英語残存 grep ヒット 0
- [ ] api diff 空
- [ ] eyebrow 削除後の上端余白崩れなし（Phase 11・user-gated）
