# Phase 9: 品質保証

## QA チェックリスト

| 項目 | 判定方法 | PASS 基準 |
|------|---------|----------|
| 型 | `mise exec -- pnpm typecheck` | error / warning 0 件 |
| Lint | `mise exec -- pnpm lint` | error 0 件 |
| Test | `mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx apps/web/src/lib/constants/__tests__/form.spec.ts` | 全件 PASS |
| HEX 直書き | `grep -nE "#[0-9a-fA-F]{3,8}" apps/web/src/styles/legacy-public.css apps/web/src/components/public/CallToActionCTA.tsx` の対象 block | 該当箇所 0 件 |
| hardcode 重複 | `grep -rn "1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ" apps/web/src` | `constants/form.ts` 1 件のみ |
| `describe.skip` / TODO 残存 | `grep -rn "describe.skip\|it.skip\|TODO\|FIXME\|XXX" apps/web/src/components/public/CallToActionCTA.tsx apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx apps/web/src/lib/constants/` | 0 件 |
| 削除確認 | 本タスクは追加のみ。stub 化対象なし（FB UI-02-1 適用外） | — |

## a11y 観点

| 項目 | 確認 |
|------|------|
| `target="_blank"` + `rel="noopener noreferrer"` | Phase 4 / Phase 6 のテストで検証済み |
| h2 見出しの semantic 階層 | HomePage 内 `<h2>` 並列（Stats / ZoneIntro / featured-members と同階層）OK |
| anchor の visible text | "回答フォームを開く"（外部 link であることが文脈で明確） |

## 完了条件

全項目 PASS。1 件でも FAIL なら Phase 5 / 6 に戻る。

## 成果物

`outputs/phase-9/qa.md`
