# Phase 10: 最終レビュー

| AC | 結果 | 根拠 |
|----|------|------|
| AC-1 dark variant render | PASS | component test + Phase 11 screenshots |
| AC-2 MemberGrid 後 mount + 常時表示 | PASS | `apps/web/app/page.tsx` で条件分岐外配置 |
| AC-3 target/rel | PASS | component test + Playwright 属性検証 |
| AC-4 responderUrl が CLAUDE.md 固定値 | PASS | `FORM_RESPONDER_URL` test |
| AC-5 `data-component="call-to-action-cta"` | PASS | component test |
| AC-6 component test | PASS | 9 cases |
| AC-7 typecheck | PASS | `pnpm -F "@ubm-hyogo/web" typecheck` |
| AC-8 HEX 直書きなし | PASS | CSS は `--ubm-*` token / `color-mix` 使用 |
| AC-9 dev server 目視 / screenshot | PASS | `outputs/phase-11/screenshots/` 3 PNG |
| AC-10 parent spec DoD 整合 | PASS | parent spec / unassigned-task / integration-fixes index を同一 wave で同期 |

## 最終判定

PASS。Phase 13（commit / push / PR）は user 明示承認待ち。
