# System Spec Update Summary — 08b Playwright Coverage

> `scaffolding-only` / `VISUAL_DEFERRED` 境界に従い、UI/UX 正本への「実行済み」昇格は行わない。本ファイルは差分提案と、最小限の正本同期状態を記録する。

## 同期状態凡例

- `no-change`: 既存 spec で十分。差分提案なし
- `proposal-only`: 本 task で提案、spec への適用は別 task
- `applied`: 本 task で spec 本体に適用済み
- `blocked`: 適用に上流依存があり、現時点で適用不可

## 1. `docs/00-getting-started-manual/specs/09-ui-ux.md`

**同期状態**: `proposal-only`

### 提案差分

| 項目 | 現状 | 提案 |
| --- | --- | --- |
| 検証マトリクス粒度 | 「10 画面 × desktop / mobile」が章立てのみ | screen × viewport × state（44 cell）の表形式に再構成し、Playwright spec ファイル名を rightmost 列に追記 |
| screenshot 命名規約 | 未記載 | `{viewport}/{screen}-{state?}.png` を明文化（例: `desktop/login-unregistered.png`、`mobile/admin-meetings.png`） |
| a11y 受入基準 | 「WCAG 2.1 AA」の文言のみ | `@axe-core/playwright` で `wcag2a / wcag2aa / wcag21a / wcag21aa` の 4 tag を `withTags()` 指定し、`impact: critical / serious` のみ FAIL とする運用方針 |
| 検証ゲート記述 | 表のみ | 「Playwright spec が green かつ axe violations === 0 で当該 cell green」と判定基準を追記 |

### 10 画面 × 2 viewport カバレッジ提案表

| 画面 | URL | desktop spec | mobile spec | a11y |
| --- | --- | --- | --- | --- |
| landing | `/` | public-flow | public-flow | a11y |
| 一覧 | `/members` | public-flow | public-flow | a11y |
| 詳細 | `/members/[id]` | public-flow | public-flow | a11y |
| 登録 | `/register` | public-flow | public-flow | a11y |
| login | `/login`(5 state) | auth-gate-state | auth-gate-state | a11y |
| profile | `/profile` | profile | profile | a11y |
| admin top | `/admin` | admin-pages | admin-pages | a11y |
| admin members | `/admin/members` | admin-pages | admin-pages | a11y |
| admin tags | `/admin/tags` | admin-pages | admin-pages | — |
| admin schema | `/admin/schema` | admin-pages | admin-pages | — |
| admin meetings | `/admin/meetings` | admin-pages | admin-pages | — |

→ 10 画面（admin top を含めると 11）すべて `apps/web/playwright/tests/*.spec.ts` で実装側 green を担保する記述を追加。

## 2. `docs/00-getting-started-manual/specs/13-mvp-auth.md`

**同期状態**: `proposal-only`

### 提案差分

| 項目 | 提案 |
| --- | --- |
| AuthGateState 5 状態 | `input / sent / unregistered / rules_declined / deleted` を `/login` 内 1 URL で出し分けると明文化（`auth-gate-state.spec.ts` で固定） |
| `/no-access` URL | **404 を返し専用画面に依存しない**（不変条件 #9）と明記。Playwright で `response.status() === 404` を assert 済み |
| 削除済み member の deleted 状態 | 不変条件 #7 と同居して扱い、Playwright で `login-deleted.png` evidence を取得する旨追記 |

## 3. `docs/00-getting-started-manual/specs/11-admin-management.md`

**同期状態**: `proposal-only`

### 提案差分

| 項目 | 提案 |
| --- | --- |
| 認可境界の 3 軸検証 | admin / member / anonymous の 3 ロール × 5 画面 = 15 cell の認可マトリクスを E2E (`admin-pages.spec.ts`) で検証する旨を追記 |
| member 403 / anon redirect | `admin-forbidden-member.png`、`admin-redirect-login.png` を evidence 必須に追加 |
| attendance 二重防御（不変条件 #15） | `attendance.spec.ts` で dup toast + 削除済み除外を E2E 化する旨を 11-admin-management.md の attendance 節に追記 |

## 4. `docs/00-getting-started-manual/specs/12-search-tags.md`

**同期状態**: `proposal-only`

### 提案差分

| 項目 | 提案 |
| --- | --- |
| 検索 6 パラメータの URL 契約 | `q / zone / status / tag / sort / density` の URL クエリと表示の一致を `search-density.spec.ts` で固定 |
| density 3 値のレイアウト変化 | `comfy / dense / list` でカード密度・列数が変化することを screenshot diff（visual regression は scope 外、screenshot evidence のみ）で観測 |

## 同期状態サマリ

| spec | 同期状態 | 適用予定 |
| --- | --- | --- |
| 09-ui-ux.md | proposal-only | 09a / full-execution task |
| 13-mvp-auth.md | proposal-only | 09a / full-execution task |
| 11-admin-management.md | proposal-only | 09a / full-execution task |
| 12-search-tags.md | proposal-only | 09a / full-execution task |

→ **4 spec** に提案差分を記録（完了条件「3 spec 以上」を満たす）。

## 5. Same-wave 正本同期

| 対象 | 同期内容 |
| --- | --- |
| `references/testing-playwright-e2e.md` | UBM-Hyogo web Playwright scaffold の `scaffolding-only` / `VISUAL_DEFERRED` 境界を追記 |
| `references/task-workflow-active.md` | 08b を active/spec_created として登録し、09a/09b への委譲を明記 |
| `indexes/resource-map.md` / `indexes/quick-reference.md` | `generate-index.js` で再生成対象 |
