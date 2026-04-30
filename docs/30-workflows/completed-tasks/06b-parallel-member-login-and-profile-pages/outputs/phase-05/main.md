# Phase 05 outputs: 実装ランブック

## サマリ

`/login`（5 状態 switch）、`/profile`（read-only RSC + 04b fetch）、middleware（`/profile/:path*` matcher）の placeholder 実装手順、ESLint custom rule 4 種（`<form>` ban / `localStorage` ban / `/no-access` literal ban / `window.UBM` ban）、sanity check S-01〜S-08 を確定。実装の擬似コードと検証コマンドを `runbook.md` に集約。

## 実装対象

| ファイル | 役割 |
| --- | --- |
| `apps/web/middleware.ts` | `/profile/:path*` で session 必須 → `/login?redirect=...` redirect |
| `apps/web/app/login/page.tsx` | searchParams を `loginQuerySchema.safeParse` |
| `apps/web/app/login/_components/LoginPanel.client.tsx` | switch case で 5 状態の Banner / CTA を出し分け |
| `apps/web/app/login/_components/MagicLinkForm.client.tsx` | email + submit + 60s cooldown + history.replaceState |
| `apps/web/app/profile/page.tsx` | `Promise.all([fetchAuthed(/me), fetchAuthed(/me/profile)])` |
| `apps/web/app/profile/_components/StatusSummary.tsx` | rulesConsent / publicConsent / publishState / isDeleted を KVList |
| `apps/web/app/profile/_components/EditCta.tsx` | editResponseUrl button + responderUrl link |
| `apps/web/app/profile/_components/ProfileFields.tsx` | stableKey 経由参照のみ（不変条件 #1） |
| `apps/web/app/profile/_components/AttendanceList.tsx` | 参加履歴 |

## ESLint rule（要約）

- `<form>` を `apps/web/app/profile` 配下で禁止
- `localStorage` MemberExpression を禁止
- `"/no-access"` Literal を禁止
- `no-restricted-globals: ["error", "UBM"]`

## sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `pnpm dev`（apps/web）起動 | port 3000 listen |
| S-02 | `curl http://localhost:3000/login` | 200 + input state |
| S-03 | `curl "http://localhost:3000/login?state=sent&email=foo@bar"` | 200 + sent state |
| S-04 | `curl "http://localhost:3000/login?state=unregistered"` | 200 + register CTA |
| S-05 | `curl -I http://localhost:3000/profile` | 302 → /login?redirect=/profile |
| S-06 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` | 0 件 |
| S-07 | `grep -r "/no-access" apps/web` | 0 件 |
| S-08 | `grep -r "form" apps/web/app/profile/_components` | 編集 form 不在 |

## 不変条件チェック

- #4: `/profile` に編集 form / button なし（ステップ 3 + ESLint）
- #5: fetcher が apps/api 経由のみ
- #6: `window.UBM` 阻止
- #7: session.memberId のみ参照
- #8: localStorage 阻止
- #9: `/no-access` 阻止

詳細は `runbook.md` を参照。
