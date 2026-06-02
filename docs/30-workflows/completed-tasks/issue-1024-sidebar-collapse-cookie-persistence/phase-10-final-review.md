# Phase 10: 最終レビュー

> issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）
> GitHub Issue #1024 は **CLOSED のまま現行コードへ再スコープ**して作成（reopen しない）。

## 10.1 受入条件 最終チェック表（AC-1〜AC-5）

| AC | 内容 | 検証方法 | 判定基準 | 状態 |
|----|------|----------|----------|------|
| AC-1 | toggle で cookie へ書き込む | `useSidebarState.spec.tsx` の toggle ケースで `document.cookie` に `ubm_shell_collapsed=true` を確認 | toggle で cookie が更新される | PASS |
| AC-2 | SSR seed でちらつき排除 | `SidebarShell.server.spec.tsx` で `next/headers` cookies() mock を与え、`data-shell-collapsed` の初回値が cookie と一致 | cookie=`true` で初回 render が `data-shell-collapsed="true"` | PASS |
| AC-3 | cookie I/O が単一 source | prod code では cookie helper 経由。tests/docs の literal は検証 fixture として許容 | cookie 名定数と writer/parser が `shell-collapse-cookie.ts` に集約 | PASS |
| AC-4 | localStorage 撤廃 + lint green | `grep -RnE "localStorage\|sessionStorage\|\"local\" *\+ *\"Storage\"" apps/web/src/components/shell/useSidebarState.ts` が 0 件、`pnpm --filter @ubm-hyogo/web lint` が exit 0 | 当該ファイルから Web Storage トークン・`"local"+"Storage"` 文字列分割が消滅 | PASS |
| AC-5 | hook 戻り値不変 + md heuristic 維持 + shell系 spec 全 pass | focused Vitest 3 files / 15 tests PASS | 既存 consumer（`SidebarShell.tsx` / context）が型変更なしで通る | PASS |

## 10.2 DoD（Definition of Done）

本サイクルで以下を満たす。commit / push / PR / remote CI は user-gated。

- [x] ビルド成功: `pnpm --filter @ubm-hyogo/web lint` 内の `tsc -p tsconfig.json --noEmit` が exit 0（型エラー 0）。
- [x] lint green: `pnpm --filter @ubm-hyogo/web lint` が exit 0。とくに `scripts/lint-boundaries.mjs` の Web Storage 禁止トークン検査に違反しない。
- [x] focused vitest 全 pass: 3 files / 15 tests PASS。
- [x] grep localStorage 0 件: `apps/web/src/components/shell/useSidebarState.ts` に `localStorage` / `sessionStorage` / `"local" + "Storage"` が存在しない。
- [x] cookie helper single source: prod code path is routed through `shell-collapse-cookie.ts`; tests may use literal cookie values as fixtures.
- [ ] SSR HTML seed 確認手順（Phase 11 と整合）:
  1. dev サーバで該当画面（`/profile` 等の shell 配下）を collapse して toggle。
  2. リロードし、`view-source:` で初回 HTML の `data-shell-collapsed` 値が cookie と一致することを確認。
  3. リロード直後に sidebar 幅が一瞬 expanded → collapsed へ変わるちらつきが起きないことを目視確認。
- [ ] hydration mismatch なし: console に React hydration warning が出ない（SSR seed と client 初期 render が同値）。
- [x] 後方互換: `SidebarShell` / `SidebarShellServer` の既存呼出側（3 layout）を**無改修**で通す（prop は optional、web typecheck PASS）。

## 10.3 blocker 判定

| 区分 | 判定 |
|------|------|
| 設計上の blocker | **なし**。cookie は lint-boundaries の禁止トークン対象外（`localStorage`/`sessionStorage` を含まない）、`next/headers` の `cookies()` は server component で標準利用可能、prop は optional 追加で後方互換。 |
| 依存上の blocker | **なし**。親 workflow Task A / Task E は dev マージ済（現行 HEAD で実在確認）。本タスクはその上に cookie seed 層を追加する後方互換変更。 |
| 外部操作の gate | commit / push / PR は **user 明示承認後のみ**（Gate-C）。 |

判定: **local implementation complete / external ops user-gated**。
