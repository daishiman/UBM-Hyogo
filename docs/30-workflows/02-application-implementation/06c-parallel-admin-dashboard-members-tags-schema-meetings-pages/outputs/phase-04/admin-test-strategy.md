# Admin Test Strategy

06c の verify suite は unit / contract / E2E / authz / lint / a11y の6層で構成する。

| Layer | Tool | Scope | Status |
| --- | --- | --- | --- |
| unit | Vitest + RTL | `MemberDrawer`, `MeetingPanel`, `SchemaDiffPanel`, admin API helper | 実装済み |
| contract | Vitest + zod | 04c `/admin/*` response shape | 08aへ委譲 |
| E2E | Playwright | `/admin` 5画面 desktop/mobile | 08bへ委譲 |
| authz | Playwright / route tests | 未認証・非admin redirect | 05a/08bへ委譲 |
| lint | ESLint no-restricted-imports | apps/web から D1/repository import禁止 | lint foundationへ委譲 |
| a11y | axe | drawer / form / nav | 08bへ委譲 |

## AC対応

| AC | Test |
| --- | --- |
| AC-1 | `MemberDrawer.test.tsx` で profile本文 field 不在 |
| AC-2 | `MemberDrawer.test.tsx` で tag編集form不在、link存在 |
| AC-3 | `SchemaDiffPanel.test.tsx` + grep |
| AC-4 | `MeetingPanel.test.tsx` |
| AC-5 | `MeetingPanel.test.tsx` |
| AC-6 | grep / 後続 ESLint |
| AC-7 | 05a gate tests / 08b |
| AC-8 | dashboard page review |
| AC-9 | public/member view contract |
| AC-10 | `MemberDrawer` link assertion |
