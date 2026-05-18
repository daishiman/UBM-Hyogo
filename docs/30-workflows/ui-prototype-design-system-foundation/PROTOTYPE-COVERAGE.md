---
workflow_id: ui-prototype-design-system-foundation
status: spec_created
taskType: implementation
visualEvidence: VISUAL
---

# Prototype Coverage

この台帳は、凍結プロトタイプと 09a-09h 正本仕様の情報が本 workflow に漏れなく反映されているかを確認する SSOT である。実装時は URL ではなく `current_app_path` を正として編集する。

## 1. Source Inventory

| source | 役割 | workflow 反映先 |
|--------|------|-----------------|
| `docs/00-getting-started-manual/claude-design-prototype/app.jsx` | prototype shell / nav / route switching | `parallel-03`, `serial-05` |
| `data.jsx` | fixture members / meetings / survey sections | `serial-05`, `serial-06`, `serial-07` |
| `icons.jsx` | icon name / visual semantics | `parallel-04`, `serial-05` |
| `index.html` | prototype boot order and embedded CSS parity source | `parallel-01`, `parallel-02` |
| `pages-public.jsx` | public top / members / member detail | `serial-05`, `serial-06` |
| `pages-member.jsx` | login / register / profile patterns | `serial-05`, `serial-06` |
| `pages-admin.jsx` | admin dashboard / members / tags / schema | `serial-05` |
| `primitives.jsx` | UI primitive behavior and composition | `serial-05`, `parallel-04` |
| `styles.css` | rhythm / cards / hover / visibility / shell CSS | `parallel-01`, `parallel-02`, `parallel-03` |
| `specs/09a-prototype-map.md` | prototype source map | root / `serial-00` |
| `specs/09b-design-tokens.md` | OKLch token contract | `parallel-01`, `parallel-02` |
| `specs/09c-primitives.md` | production primitive mapping | `serial-05` |
| `specs/09d-icons.md` | icon contract | `parallel-04`, `serial-05` |
| `specs/09e-screen-blueprints-public.md` | public blueprint | `serial-05`, `serial-06` |
| `specs/09f-screen-blueprints-member.md` | member / auth blueprint | `serial-05`, `serial-06` |
| `specs/09g-screen-blueprints-admin.md` | admin blueprint | `serial-05` |
| `specs/09h-shell-and-fixtures.md` | shell / fixture / fallback | `parallel-03`, `parallel-04`, `serial-07` |

## 2. Route Coverage Matrix

| route | current_app_path | prototype / spec source | required reflection | workflow owner | status |
|-------|------------------|-------------------------|---------------------|----------------|--------|
| `/` | `apps/web/app/page.tsx` | `pages-public.jsx` LandingPage / `09e` §1 | hero, public stats, zones, featured members, recent meetings, CTA | `serial-05` G-T | covered |
| `/members` | `apps/web/app/(public)/members/page.tsx` | `pages-public.jsx` MemberListPage / `09e` §2 | filters, density, tag pill, member card grid/list | `serial-05` G-M + `parallel-02` | covered |
| `/members/[id]` | `apps/web/app/(public)/members/[id]/page.tsx` | `pages-public.jsx` member detail / `09e` §3 | profile hero, response sections, links, tags, visibility markers | `serial-05` G-M + `serial-06` | covered |
| `/register` | `apps/web/app/(public)/register/page.tsx` | `pages-member.jsx` MemberFormPage / `09e` derived register | Google Form CTA, steps, form preview, FAQ | `serial-05` G-R | covered |
| `/privacy` | `apps/web/app/privacy/page.tsx` | `09e` derived legal | LegalProse using same card / rhythm | `serial-05` G-R | covered |
| `/terms` | `apps/web/app/terms/page.tsx` | `09e` derived legal | LegalProse using same card / rhythm | `serial-05` G-R | covered |
| `/login` | `apps/web/app/login/page.tsx` | `pages-member.jsx` LoginPage / `09f` §1 | auth card, Magic Link, Google OAuth, sent state, safe redirect | `serial-05` G-A | covered |
| `/profile` | `apps/web/app/profile/page.tsx` | `pages-member.jsx` MyProfilePage / `09f` §2 | profile hero, consent snapshot, public/member/private sections, revalidate prompt | `serial-05` G-D + `serial-06` | covered |
| `/admin` | `apps/web/app/(admin)/admin/page.tsx` | `pages-admin.jsx` AdminDashboardPage / `09g` §1 | KPI cards, recent activity, queue previews | `serial-05` G-D | covered |
| `/admin/members` | `apps/web/app/(admin)/admin/members/page.tsx` | `pages-admin.jsx` AdminMembersPage / `09g` §2 | members table, drawer, filters | `serial-05` G-G | covered |
| `/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | `pages-admin.jsx` AdminTagsPage / `09g` §3 | tag queue panels | `serial-05` G-G | covered |
| `/admin/meetings` | `apps/web/app/(admin)/admin/meetings/page.tsx` | `09g` derived admin | meeting panel without new endpoint | `serial-05` G-G | covered |
| `/admin/schema` | `apps/web/app/(admin)/admin/schema/page.tsx` | `pages-admin.jsx` SchemaDiffPage / `09g` §4 | schema diff panel and alias state | `serial-05` G-G | covered |
| `/admin/requests` | `apps/web/app/(admin)/admin/requests/page.tsx` | `09g` derived admin | request queue panel | `serial-05` G-G | covered |
| `/admin/identity-conflicts` | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | `09g` derived admin | identity conflict rows | `serial-05` G-G | covered |
| `/admin/audit` | `apps/web/app/(admin)/admin/audit/page.tsx` | `09g` derived admin | audit log panel, masked PII | `serial-05` G-G | covered |
| `error.tsx` | `apps/web/app/error.tsx` | `09h` fallback | card shell and retry affordance | `parallel-04`, `serial-07` | covered |
| `not-found.tsx` | `apps/web/app/not-found.tsx` | `09h` fallback | EmptyState / navigation CTA | `parallel-04`, `serial-07` | covered |
| `loading.tsx` | `apps/web/app/loading.tsx` | `09h` fallback | skeleton rhythm | `parallel-04`, `serial-07` | covered |

## 3. Design System Coverage

| prototype concern | concrete source | workflow owner | implementation gate |
|-------------------|-----------------|----------------|---------------------|
| OKLch palette and theme split | `styles.css`, `09b` | `parallel-01` | `bash scripts/verify-design-tokens.sh` |
| page rhythm / cards / typography | `styles.css`, `primitives.jsx` | `parallel-01` | globals selector grep + visual screenshots |
| tag pill selected state | `styles.css`, `09e` member filters | `parallel-02` + `serial-05` | selected tag screenshot / `aria-selected` assertion |
| member card hover | `styles.css`, `pages-public.jsx` | `parallel-02` + `serial-07` | hover screenshot |
| visibility markers | `pages-member.jsx`, `09h` fixture | `parallel-02` + `serial-06` | `data-visibility` DOM and screenshot |
| public / admin / member shell | `app.jsx`, `09h` | `parallel-03` | layout DOM scrape |
| root fallback chrome | `09h` | `parallel-04` | error / not-found / loading screenshots |
| fixture-to-view binding | `data.jsx`, `09h` | `serial-06` + `serial-07` | mocked API / Playwright fixture |

## 4. 30-Method Compact Evidence

| category | applied methods | conclusion |
|----------|-----------------|------------|
| 論理分析系 | 批判的 / 演繹 / 帰納 / アブダクション / 垂直 | prototype sources existed, but previous specs lacked one table proving every source and route was consumed. This file closes that gap. |
| 構造分解系 | 要素分解 / MECE / 2軸 / プロセス | source inventory, route matrix, design-system matrix, and gates separate concerns without duplication. |
| メタ・抽象系 | メタ / 抽象化 / ダブルループ | the real issue is traceability from frozen prototype to current app paths. |
| 発想・拡張系 | ブレスト / 水平 / 逆説 / 類推 / if / 素人 | a new coverage SSOT is simpler than repeating prototype references in every phase file. |
| システム系 | システム / 因果関係 / 因果ループ | route path drift causes wrong edits; `current_app_path` prevents repeated implementation mistakes. |
| 戦略・価値系 | トレードオン / プラスサム / 価値提案 / 戦略 | one compact table improves both skill compliance and implementation readiness with minimal complexity. |
| 問題解決系 | why / 改善 / 仮説 / 論点 / KJ法 | root cause was missing traceability; grouped matrices make the remaining work directly executable. |

## 5. Four-Condition Gate

| condition | result | evidence |
|-----------|--------|----------|
| 矛盾なし | PASS | current app paths are explicit; `/login` / `/profile` / `/privacy` / `/terms` are no longer inferred as route-group files |
| 漏れなし | PASS | all prototype JSX files and 09a-09h specs are listed in Source Inventory |
| 整合性あり | PASS | workflow owner names match root `index.md` sub-workflow names |
| 依存関係整合 | PASS | parallel owners handle CSS/shell; serial owners handle page binding, response binding, and regression evidence |
