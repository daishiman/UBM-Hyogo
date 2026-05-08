# 09a prototype map

## 1. Position

This file is the visual source map from the frozen design prototype to production implementation targets.
It does not define token values, runtime state, API schemas, or component props.
Those responsibilities stay in `09b-design-tokens.md`, `09-ui-ux.md`, and API specs.

### 1.1 Frozen Sources

| source | role | line range |
|--------|------|------------|
| `app.jsx` | route shell, nav chrome, demo edit controls | L1-L251 |
| `primitives.jsx` | primitive UI component prototypes | L1-L272 |
| `pages-public.jsx` | public landing, members, member detail | L1-L472 |
| `pages-member.jsx` | login, member form, profile | L1-L373 |
| `pages-admin.jsx` | admin dashboard, members, tags, schema | L1-L658 |
| `icons.jsx` | prototype icon catalog | L1-L79 |
| `data.jsx` | demo fixtures | L1-L339 |
| `styles.css` | class names only; token values are out of scope | L1-L1012 |

### 1.2 Line Range Rule

Every line range is written as `L<start>-L<end>`.
Downstream implementation tasks search this file first, then inspect the frozen prototype line range.
If a prototype file changes, this file and the verifier must change in the same task.

### 1.3 Missing Prototype Screens

Routes that do not exist in the prototype are marked as `(not present)`.
Those rows must use `§5.1` through `§5.8` derivation rules.
New primitives are not allowed for missing screens.

### 1.4 Scope Boundaries

- Token values are not copied from `styles.css`.
- Props and state contracts are not finalized here.
- Application code is not changed by this document.
- EDITMODE-only prototype behavior is rejected explicitly.
- Route-to-API contracts remain in the phase-3 API mapping and API specs.

## 2. UI primitives x production component mapping

| prototype component | source | 本番実装 path（task-10） | RSC-safe | 備考 |
|---------------------|--------|--------------------------|----------|------|
| `Chip` | `primitives.jsx L6-L14` | `apps/web/src/components/ui/badge.tsx` | yes | production name is `Badge`; `tone` maps to `variant` |
| `Avatar` | `primitives.jsx L37-L89` | `apps/web/src/components/ui/avatar.tsx` | yes | editable photo behavior is not part of MVP |
| `AvatarStoreProvider` | `primitives.jsx L20-L28` | not implemented | no | 不採用: localStorage photo store is EDITMODE-only |
| `Button` | `primitives.jsx L92-L110` | `apps/web/src/components/ui/button.tsx` | yes | variants: primary, accent, ghost, soft, danger |
| `Switch` | `primitives.jsx L113-L115` | `apps/web/src/components/ui/switch.tsx` | client | keep native button semantics and `aria-pressed` |
| `Segmented` | `primitives.jsx L118-L126` | `apps/web/src/components/ui/segmented-control.tsx` | client | used by display density controls |
| `Field` | `primitives.jsx L129-L143` | `apps/web/src/components/ui/field.tsx` | yes | label, required, optional, hint, error wrapper |
| `Input` | `primitives.jsx L145-L145` | `apps/web/src/components/ui/input.tsx` | yes | field class only; no token values copied |
| `Textarea` | `primitives.jsx L146-L146` | `apps/web/src/components/ui/textarea.tsx` | yes | inherits field-group semantics |
| `Select` | `primitives.jsx L147-L147` | `apps/web/src/components/ui/select.tsx` | yes | native select first |
| `Search` | `primitives.jsx L150-L155` | `apps/web/src/components/ui/search-field.tsx` | client | used by `FilterBar` |
| `Drawer` | `primitives.jsx L158-L174` | `apps/web/src/components/ui/drawer.tsx` | client | dialog semantics and focus trap required |
| `Modal` | `primitives.jsx L177-L195` | `apps/web/src/components/ui/modal.tsx` | client | dialog semantics and focus trap required |
| `ToastProvider` | `primitives.jsx L201-L223` | `apps/web/src/components/ui/toast.tsx` | client | provider mounted at app shell boundary |
| `Toast` | `primitives.jsx L201-L223` | `apps/web/src/components/ui/toast.tsx` | client | status messages only |
| `KVList` | `primitives.jsx L226-L235` | `apps/web/src/components/ui/kv-list.tsx` | yes | public detail and profile summary |
| `LINK_ICONS` | `primitives.jsx L238-L241` | `apps/web/src/components/ui/link-pills.tsx` | yes | icon source only |
| `LINK_LABELS` | `primitives.jsx L243-L246` | `apps/web/src/components/ui/link-pills.tsx` | yes | label map source |
| `LinkPills` | `primitives.jsx L248-L262` | `apps/web/src/components/ui/link-pills.tsx` | yes | render visible labels with links |
| `zone/status tone helpers` | `primitives.jsx L265-L266` | `apps/web/src/lib/tone.ts` | yes | names only; token values are task-08 |

## 3. All 19 routes mapping

### 3.1 Public layer

| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |
|-------|----------------|------------|---------------|-----------------|------|
| `/` | `pages-public.jsx` | `L4-L154` | `LandingPage / Hero / Stats / ZoneGuide / Timeline` |  | prototype faithful |
| `/(public)/members` | `pages-public.jsx` | `L208-L338` | `MemberListPage / FilterBar / MemberCardPublic / DensityToggle` |  | density values: comfy, dense, list |
| `/(public)/members/[id]` | `pages-public.jsx` | `L339-L472` | `MemberDetailPage / ProfileHero / KVList / LinkPills` |  | public fields only |
| `/(public)/register` | `(not present)` | `—` | `Hero / Card / Button` | `§5.2` | external responder redirect |
| `/privacy` | `(not present)` | `—` | `LegalProse` | `§5.1` | static legal page |
| `/terms` | `(not present)` | `—` | `LegalProse` | `§5.1` | static legal page |

### 3.2 Member layer

| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |
|-------|----------------|------------|---------------|-----------------|------|
| `/login` | `pages-member.jsx` | `L4-L67` | `LoginPage / LoginInput / LoginSent / LoginUnregistered / LoginDeleted / LoginError` |  | five auth gate states |
| `/profile` | `pages-member.jsx` | `L220-L373` | `MyProfilePage / VisibilityBanner / VisibilitySummary / RequestPanel / DeleteRequestPanel` |  | profile self-service only |

### 3.3 Admin layer

| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |
|-------|----------------|------------|---------------|-----------------|------|
| `/(admin)/admin` | `pages-admin.jsx` | `L4-L161` | `AdminDashboardPage / KpiGrid / ZoneChart / StatusChart / RecentActions` |  | dashboard summary |
| `/(admin)/admin/members` | `pages-admin.jsx` | `L162-L368` | `AdminMembersPage / MembersTable / MemberDrawer` |  | table plus right drawer |
| `/(admin)/admin/tags` | `pages-admin.jsx` | `L369-L507` | `AdminTagsPage / TagsQueue` | `§5.3` | prototype exists; queue derivation applies to requests too |
| `/(admin)/admin/meetings` | `(not present)` | `—` | `DataTable / MeetingForm / Modal` | `§5.4` | CRUD pattern |
| `/(admin)/admin/schema` | `pages-admin.jsx` | `L508-L658` | `SchemaDiffPage / SchemaDiff / ApplyConfirm` | `§5.5` | prototype partially covers diff |
| `/(admin)/admin/requests` | `(not present)` | `—` | `RequestsQueue / RequestDetail / Drawer` | `§5.3` | queue pattern |
| `/(admin)/admin/identity-conflicts` | `(not present)` | `—` | `ConflictPair / SideBySideCompare` | `§5.6` | compare and resolve |
| `/(admin)/admin/audit` | `(not present)` | `—` | `AuditFilterBar / AuditTimeline` | `§5.7` | timeline pattern |

### 3.4 Common app routes

| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |
|-------|----------------|------------|---------------|-----------------|------|
| `app/error.tsx` | `(not present)` | `—` | `ErrorState` | `§5.8` | reset action and Sentry capture |
| `app/global-error.tsx` | `(not present)` | `—` | `ErrorState` | `§5.8` | includes root fallback shell |
| `app/not-found.tsx` | `(not present)` | `—` | `EmptyState` | `§5.8` | static 404 |

## 4. Shell, chrome, and spec file mapping

### 4.1 Shell and chrome mapping

| element | source | production target |
|---------|--------|-------------------|
| `App` shell | `app.jsx L24-L117` | `apps/web/src/app/layout.tsx` |
| `ROUTES` map | `app.jsx L11-L22` | Next.js filesystem routes; no runtime map |
| `Sidebar` | `app.jsx L119-L164` | `apps/web/src/app/(admin)/layout.tsx` |
| `Topbar` | `app.jsx L166-L191` | `apps/web/src/app/(public)/layout.tsx` |
| `MinimalBar` | `app.jsx L193-L211` | `apps/web/src/app/login/layout.tsx` or local minimal shell |
| `TweaksPanel` | `app.jsx L213-L251` | 不採用: EDITMODE-only control panel |
| `data-theme="warm"` | `styles.css L42-L70` | 不採用: token choice belongs to task-08 |
| `data-theme="cool"` | `styles.css L42-L70` | 不採用: token choice belongs to task-08 |

### 4.2 Prototype source to 09c-09h spec mapping

| prototype source | 行範囲 | mapping 先 spec |
|------------------|--------|-----------------|
| `primitives.jsx` | `L1-L272` | `09c-primitives.md` |
| `icons.jsx` | `L1-L79` | `09d-icons.md` |
| `pages-public.jsx` | `L1-L472` | `09e-screen-blueprints-public.md` |
| `pages-member.jsx` | `L1-L373` | `09f-screen-blueprints-member.md` |
| `pages-admin.jsx` | `L1-L658` | `09g-screen-blueprints-admin.md` |
| `app.jsx` | `L1-L251` | `09h-shell-and-fixtures.md` shell section |
| `data.jsx` | `L1-L339` | `09h-shell-and-fixtures.md` fixtures section |

## 5. Derivation rules for screens missing from the prototype

### 5.1 Legal pages

Use `Container` plus `LegalProse`.
`LegalProse` is a card-like text frame built from the existing card pattern.
Target routes: `/privacy`, `/terms`.
Do not introduce a new primitive for legal prose unless task-10 explicitly approves it.

### 5.2 Register

Use `Container`, `Hero`, `Card`, and `Button`.
The page is a CTA and redirect surface, not a local form builder.
Target route: `/(public)/register`.
Do not copy responder URL behavior into this map.

### 5.3 Admin queue pages

Use `Sidebar`, `PageHeader`, `Tabs`, `DataTable`, and `Drawer`.
The tags prototype (`AdminTagsPage`) is the visual basis.
Target routes: `/(admin)/admin/tags`, `/(admin)/admin/requests`.
The left side owns queue selection; the right side owns decision detail.

### 5.4 Admin CRUD pages

Use `Sidebar`, `PageHeader`, `DataTable`, and `Modal Form`.
The modal form uses `Card`, `Input`, `Select`, and `Button`.
Target route: `/(admin)/admin/meetings`.
The page remains operational and table-first.

### 5.5 Admin diff pages

Use `Sidebar`, `PageHeader`, `DiffView`, and apply `Button`.
`SchemaDiffPage` supplies the prototype range.
Target route: `/(admin)/admin/schema`.
The diff uses two-column cards and a clear confirmation action.

### 5.6 Admin compare pages

Use `Sidebar`, `PageHeader`, `SideBySideCompare`, `Card`, `Badge`, and resolve `Button`.
Target route: `/(admin)/admin/identity-conflicts`.
The comparison surface is symmetrical and decision-focused.
No new compare primitive is introduced.

### 5.7 Admin timeline pages

Use `Sidebar`, `PageHeader`, `FilterBar`, and `Timeline`.
Timeline entries are vertical cards grouped by date.
Target route: `/(admin)/admin/audit`.
Filtering is the primary interaction.

### 5.8 Common error, not-found, and loading

Use `ErrorState`, `EmptyState`, and `Skeleton`.
Target files: `error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`.
`global-error.tsx` may wrap root HTML requirements, but the visual component remains `ErrorState`.

### 5.9 Primitive constraint

新規 primitive を生やさない。
task-10で確定する primitive と feature components の組合せだけで構成する。
逸脱が必要な場合は task-10 へ ECR を上げ、本ファイルと `09-ui-ux.md` を同時改訂する。

## 6. Line range ledger

| 用途 | path | line range |
|------|------|------------|
| App shell | `app.jsx` | L24-L117 |
| ROUTES map | `app.jsx` | L11-L22 |
| Sidebar | `app.jsx` | L119-L164 |
| Topbar | `app.jsx` | L166-L191 |
| MinimalBar | `app.jsx` | L193-L211 |
| TweaksPanel | `app.jsx` | L213-L251 |
| Chip | `primitives.jsx` | L6-L14 |
| AvatarStoreProvider | `primitives.jsx` | L20-L28 |
| Avatar | `primitives.jsx` | L37-L89 |
| Button | `primitives.jsx` | L92-L110 |
| Switch | `primitives.jsx` | L113-L115 |
| Segmented | `primitives.jsx` | L118-L126 |
| Field | `primitives.jsx` | L129-L143 |
| Input | `primitives.jsx` | L145-L145 |
| Textarea | `primitives.jsx` | L146-L146 |
| Select | `primitives.jsx` | L147-L147 |
| Search | `primitives.jsx` | L150-L155 |
| Drawer | `primitives.jsx` | L158-L174 |
| Modal | `primitives.jsx` | L177-L195 |
| ToastProvider and Toast | `primitives.jsx` | L201-L223 |
| KVList | `primitives.jsx` | L226-L235 |
| LINK_ICONS | `primitives.jsx` | L238-L241 |
| LINK_LABELS | `primitives.jsx` | L243-L246 |
| LinkPills | `primitives.jsx` | L248-L262 |
| Tone helpers | `primitives.jsx` | L265-L266 |
| LandingPage | `pages-public.jsx` | L4-L154 |
| MemberCardPublic | `pages-public.jsx` | L155-L207 |
| MemberListPage | `pages-public.jsx` | L208-L338 |
| MemberDetailPage | `pages-public.jsx` | L339-L472 |
| LoginPage | `pages-member.jsx` | L4-L67 |
| MemberFormPage | `pages-member.jsx` | L68-L219 |
| MyProfilePage | `pages-member.jsx` | L220-L373 |
| AdminDashboardPage | `pages-admin.jsx` | L4-L161 |
| AdminMembersPage | `pages-admin.jsx` | L162-L368 |
| AdminTagsPage | `pages-admin.jsx` | L369-L507 |
| SchemaDiffPage | `pages-admin.jsx` | L508-L658 |
| Icons catalog | `icons.jsx` | L1-L79 |
| Demo fixture data | `data.jsx` | L1-L339 |
| Warm and cool theme prototype CSS | `styles.css` | L42-L70 |
| Prototype source file, primitives | `primitives.jsx` | L1-L272 |
| Prototype source file, public pages | `pages-public.jsx` | L1-L472 |
| Prototype source file, member pages | `pages-member.jsx` | L1-L373 |
| Prototype source file, admin pages | `pages-admin.jsx` | L1-L658 |
| Prototype source file, app shell | `app.jsx` | L1-L251 |

## 7. Downstream task lookup guide

| downstream task | lookup key | expected range |
|-----------------|------------|----------------|
| task-10 ui-primitives | `Chip` | `primitives.jsx L6-L14` |
| task-10 ui-primitives | `Drawer` | `primitives.jsx L158-L174` |
| task-10 ui-primitives | `Modal` | `primitives.jsx L177-L195` |
| task-10 ui-primitives | `ToastProvider` | `primitives.jsx L201-L223` |
| task-11 public top | `/` | `pages-public.jsx L4-L154` |
| task-11 public members | `/(public)/members` | `pages-public.jsx L208-L338` |
| task-12 member detail | `/(public)/members/[id]` | `pages-public.jsx L339-L472` |
| task-12 register | `/(public)/register` | `§5.2` |
| task-12 legal | `/privacy` | `§5.1` |
| task-13 login | `/login` | `pages-member.jsx L4-L67` |
| task-14 profile | `/profile` | `pages-member.jsx L220-L373` |
| task-15 admin dashboard | `/(admin)/admin` | `pages-admin.jsx L4-L161` |
| task-15 admin members | `/(admin)/admin/members` | `pages-admin.jsx L162-L368` |
| task-16 tags | `/(admin)/admin/tags` | `pages-admin.jsx L369-L507` |
| task-16 meetings | `/(admin)/admin/meetings` | `§5.4` |
| task-17 schema | `/(admin)/admin/schema` | `pages-admin.jsx L508-L658` |
| task-17 conflicts | `/(admin)/admin/identity-conflicts` | `§5.6` |
| task-17 audit | `/(admin)/admin/audit` | `§5.7` |
| task-19 09c | `primitives.jsx` | `L1-L272` |
| task-20 09d | `icons.jsx` | `L1-L79` |
| task-21 09e/09f/09g | `pages-public.jsx` | `L1-L472` |
| task-22 09h | `app.jsx` | `L1-L251` |

## 8. Rejection list

| item | source | decision | reason |
|------|--------|----------|--------|
| `TweaksPanel` | `app.jsx L213-L251` | 不採用 | EDITMODE-only tuning panel |
| `AvatarStoreProvider` | `primitives.jsx L20-L28` | 不採用 | localStorage photo store is not production MVP behavior |
| `data-theme="warm"` | `styles.css L42-L70` | 不採用 | theme selection is not user-facing MVP scope |
| `data-theme="cool"` | `styles.css L42-L70` | 不採用 | theme selection is not user-facing MVP scope |
| `styles.css` token values | `styles.css L1-L1012` | 不採用 | token values belong to task-08 |

## 9. Verification checklist

- `09a-prototype-map.md` has at least 360 lines.
- Section 2 maps at least 13 primitives.
- Section 3 contains exactly 19 routes: public 6, member 2, admin 8, common 3.
- Section 4 maps shell and 09c-09h source specs.
- Section 5 contains derivation rules 5.1 through 5.8.
- Section 5.9 states that new primitives are not allowed.
- Section 6 contains at least 25 line range ledger rows.
- Rejected EDITMODE items are explicitly marked with `不採用`.
- Token values such as hex colors and OKLch function literals are not copied.
- `09-ui-ux.md` links to this file.
- `scripts/verify-09a-prototype-line-ranges.sh` passes.

## 10. Compact 30-thinking evidence

| category | thinking methods | result |
|----------|------------------|--------|
| logical analysis | critical, deductive, inductive, abductive, vertical | missing artifact was the root failure; line ranges derive from actual prototype facts |
| structure | decomposition, MECE, two-axis, process | sections separate primitive, route, shell, derivation, and ledger responsibilities |
| meta and abstraction | meta, abstraction, double-loop | this file is a map, not a design system or API contract |
| ideation | brainstorming, lateral, paradox, analogy, if, novice | missing screens are handled by rules rather than inventing new screens or primitives |
| system | system, causal relation, causal loop | verifier prevents prototype drift from silently breaking downstream tasks |
| strategy and value | trade-on, plus-sum, value proposition, strategic | one map reduces lookup cost for task-10 through task-22 |
| problem solving | why, improvement, hypothesis, issue, KJ | all detected gaps group into four fixes: artifact, verifier, link, aiworkflow sync |

## 11. Four-condition gate

| condition | decision | evidence |
|-----------|----------|----------|
| no contradiction | PASS | docs-only scope excludes app code and token values |
| no omissions | PASS | 19 routes, 13+ primitives, shell, 09c-09h, rejection list covered |
| consistency | PASS | fixed column names and `L<start>-L<end>` ranges |
| dependency alignment | PASS | downstream task lookup table preserves task-10 through task-22 dependencies |

## 12. Revision history

| date | change |
|------|--------|
| 2026-05-07 | Initial prototype mapping table created from frozen prototype sources |

## 13. Grep keys

Use these stable strings for downstream lookup.

| grep key | consumer |
|----------|----------|
| `Chip` | task-10 |
| `Avatar` | task-10 |
| `Button` | task-10 |
| `Switch` | task-10 |
| `Segmented` | task-10 |
| `Field` | task-10 |
| `Search` | task-10 |
| `Drawer` | task-10 |
| `Modal` | task-10 |
| `ToastProvider` | task-10 |
| `KVList` | task-10 |
| `LinkPills` | task-10 |
| `LandingPage` | task-11 |
| `MemberListPage` | task-11 |
| `MemberDetailPage` | task-12 |
| `LoginPage` | task-13 |
| `MyProfilePage` | task-14 |
| `AdminDashboardPage` | task-15 |
| `AdminMembersPage` | task-15 |
| `AdminTagsPage` | task-16 |
| `SchemaDiffPage` | task-17 |
| `LegalProse` | task-12 |
| `RequestsQueue` | task-16 |
| `MeetingForm` | task-16 |
| `ConflictPair` | task-17 |
| `AuditTimeline` | task-17 |
| `ErrorState` | task-05 |
| `EmptyState` | task-05 |
| `Skeleton` | task-05 |
| `09c-primitives.md` | task-19 |
| `09d-icons.md` | task-20 |
| `09e-screen-blueprints-public.md` | task-21 |
| `09f-screen-blueprints-member.md` | task-21 |
| `09g-screen-blueprints-admin.md` | task-21 |
| `09h-shell-and-fixtures.md` | task-22 |

## 14. Maintenance rule

Do not update prototype JSX without updating this map.
Do not update this map from memory; re-check line ranges with `sed` or `rg -n`.
Do not add a new primitive from a missing prototype screen.
Do not treat the rejection list as optional.
