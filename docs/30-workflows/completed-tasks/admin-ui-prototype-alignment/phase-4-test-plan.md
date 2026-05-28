---
実装区分: 実装仕様書
状態: completed
Phase: 4
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-3-design-review.md](./phase-3-design-review.md)
次: [phase-5-implementation.md](./phase-5-implementation.md)
---

# Phase 4: テスト計画

## 1. 目的

本 Phase は、Phase 2 設計で定義した `apps/web/src/features/admin/components/_shared/` 群、Phase 5 で改修される 11 個の admin route page、共通 `app/(admin)/layout.tsx` / `app/(admin)/admin/error.tsx`、および per-section degrade パターンに対する **テスト戦略・テストケース・mock 戦略・カバレッジ目標・vitest 実行コマンド** を定義する。Phase 5 実装前に本計画を確定し、Phase 6 で追加テストを拡充、Phase 7 でカバレッジ実測する。

## 2. テスト戦略 (4 層)

| 層 | 対象 | ツール | 配置 | 目的 |
| ---- | ---- | ---- | ---- | ---- |
| Unit | `_shared/` 6 共通コンポーネント | vitest + @testing-library/react | `apps/web/src/features/admin/components/_shared/__tests__/*.spec.tsx` | props ⇄ DOM の写像、edge case |
| Component (server) | `app/(admin)/admin/**/page.tsx` の degrade 動作 | vitest (server-component test) | `apps/web/app/(admin)/admin/**/page.spec.ts` | fetchAdmin 失敗時の per-section degrade |
| Integration | `_shared` + page の組合せ | vitest + RTL (jsdom) | `apps/web/src/features/admin/__tests__/*.integration.spec.tsx` | データ流入から画面 render まで |
| Smoke (E2E) | admin 全 route が 200 + key text 表示 | Playwright | `apps/web/playwright/tests/admin-routes-smoke.spec.ts` | route 全数 / sidebar / shell の生存確認 |

> Visual regression は **Phase 11 (手動テスト)** に分離する。本 Phase の自動テストは visual snapshot に依存しない。

## 3. 共通コンポーネント test 一覧

### 3.1 `AdminSectionCard.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-SC-001 | `title="概況"` + children | `<section>` 内に title と children | props → DOM (prop) |
| TC-SC-002 | `description` 渡し | description が `<p>` で render | prop |
| TC-SC-003 | `actions` slot 渡し | header 右端に actions render | slot 配置 |
| TC-SC-004 | `tone="danger"` | OKLch danger token class が付与 | token 整合 |
| TC-SC-005 | children なし | empty placeholder ではなく単に空 section | edge |
| TC-SC-006 | `as="div"` | root tag が div | polymorphic |

### 3.2 `AdminSectionError.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-SE-001 | `error=Error("boom")` | message が表示 | prop |
| TC-SE-002 | `onRetry` 渡し | retry button が click 可能で callback 発火 | callback |
| TC-SE-003 | `onRetry` なし | retry button 非表示 | conditional |
| TC-SE-004 | `errorId` 指定 | エラー ID が表示 | trace |
| TC-SE-005 | 長文 message | overflow truncate | a11y |
| TC-SE-006 | tone color | OKLch danger token のみ | token |

### 3.3 `AdminEmptyState.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-ES-001 | `title="データなし"` | title 表示 | prop |
| TC-ES-002 | `description` | description `<p>` | prop |
| TC-ES-003 | `cta={{label, href}}` | link button render | slot |
| TC-ES-004 | `illustration` slot | illustration container | slot |
| TC-ES-005 | cta 未指定 | button 非表示 | conditional |

### 3.4 `AdminStat.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-ST-001 | `value={42}` | `42` 表示 | format |
| TC-ST-002 | `value={1234567}` | `1,234,567` 表示 | locale format |
| TC-ST-003 | `delta={+3}` | up indicator + 緑 token | indicator |
| TC-ST-004 | `delta={-5}` | down indicator + 赤 token | indicator |
| TC-ST-005 | `delta={0}` | neutral indicator | indicator |
| TC-ST-006 | `unit="件"` | unit suffix | format |
| TC-ST-007 | `loading=true` | skeleton render | state |

### 3.5 `AdminTable.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-TB-001 | `columns + rows` | `<table><thead><tbody>` 構造 | DOM |
| TC-TB-002 | `onSort` 渡し + header click | sort callback 発火 (列 key) | callback |
| TC-TB-003 | `sortKey/sortDir` 指定 | aria-sort 属性付与 | a11y |
| TC-TB-004 | empty rows | empty fallback slot render | edge |
| TC-TB-005 | `stickyHeader=true` | thead に sticky class | layout |
| TC-TB-006 | `getRowKey` | 重複 key warning なし | React key |
| TC-TB-007 | `cell` render function | カスタム cell render | extensibility |

### 3.6 `AdminQueuePanel.spec.tsx`

| TC | 入力 | 期待 | 観点 |
| ---- | ---- | ---- | ---- |
| TC-QP-001 | `items + selectedId=undefined` | 左 list 表示、右 placeholder | state (prop) |
| TC-QP-002 | `selectedId` 指定 | 右 detail に selected item の `renderDetail` 結果 | callback |
| TC-QP-003 | left list item click | `onSelect(id)` callback 発火 | callback |
| TC-QP-004 | items 空 | left に empty state、右に placeholder | edge |
| TC-QP-005 | `selectedId` が items に存在しない | 右 placeholder へフォールバック | guard |
| TC-QP-006 | `renderItem` カスタム | 左の row が override される | slot |

> **props vs internal state 判定 (VSCPKR-03 対応)**: 上記 6 component はいずれも **controlled (props-driven)** とする。selected state は親 (page or feature container) が保持し、本 component は通知 (`onSelect`) のみ。ローカル state を持たないことで test は外部入出力のみで完結する。

### 3.7 private method テスト方針 (P0-09-U1-1 対応)

- `_shared/` の各 component で発生する補助関数 (`formatNumber`, `formatDelta`, `buildSortHandler` 等) は **同一ファイル内で `export function` として export** し、`_shared/__tests__/utils.spec.ts` に 1 ファイルでまとめてテストする。private を test するためにモジュール内部に reach しない。
- 引数 / 戻り値 / 例外 が観察可能な形であるため、public surface でテストできない private は作らない (Phase 5 実装方針)。

## 4. Page レベル test (server component degrade)

各 page の degrade 動作テストは `apps/web/app/(admin)/admin/**/page.spec.ts` に配置する。

| TC | Page | 入力 (fetchAdmin mock) | 期待 |
| ---- | ---- | ---- | ---- |
| TC-PG-DASH-001 | `/admin/page.tsx` | `fetchAdmin` resolve 正常 | KPI / Zone / 集計の各 section 通常 render |
| TC-PG-DASH-002 | `/admin/page.tsx` | `fetchAdmin` reject (500) | `AdminSectionError` が KPI section に render、他 section は影響を受けない |
| TC-PG-DASH-003 | `/admin/page.tsx` | timeout (`AbortError`) | timeout 文言 + retry 提示 |
| TC-PG-DASH-004 | `/admin/page.tsx` | 401 (auth fail) | 認証導線 (`/login?from=/admin`) 提示 |
| TC-PG-MEM-001 | `/admin/members/page.tsx` | 正常 | table render |
| TC-PG-MEM-002 | `/admin/members/page.tsx` | API fail | members section だけ degrade、shell / sidebar は健全 |
| TC-PG-TAG-001 | `/admin/tags/page.tsx` | queue 取得 fail | queue section degrade、drawer は閉鎖維持 |
| TC-PG-MTG-001 | `/admin/meetings/page.tsx` | 正常 | meeting list render |
| TC-PG-MTG-002 | `/admin/meetings/[id]/page.tsx` | not found (404) | `not-found.tsx` 経路 |
| TC-PG-SCM-001 | `/admin/schema/page.tsx` | diff fail | diff section degrade、history link 健全 |
| TC-PG-SCM-002 | `/admin/schema/history/page.tsx` | history fail | history section degrade |
| TC-PG-REQ-001 | `/admin/requests/page.tsx` | queue fail | queue degrade |
| TC-PG-IDC-001 | `/admin/identity-conflicts/page.tsx` | list fail | list degrade |
| TC-PG-AUD-001 | `/admin/audit/page.tsx` | log fail | log degrade |
| TC-PG-ATT-001 | `/admin/dashboard/attendance/page.tsx` | attendance fail | attendance degrade |

## 5. Playwright smoke

新規 `apps/web/playwright/tests/admin-routes-smoke.spec.ts` に以下を実装する。

| TC | URL | 期待 |
| ---- | ---- | ---- |
| TC-SMK-001 | `/admin` | status 200 / sidebar 表示 / heading "ダッシュボード" |
| TC-SMK-002 | `/admin/dashboard/attendance` | 200 / heading 出席 |
| TC-SMK-003 | `/admin/members` | 200 / heading "会員" |
| TC-SMK-004 | `/admin/tags` | 200 / heading "タグ" |
| TC-SMK-005 | `/admin/meetings` | 200 / heading "会合" |
| TC-SMK-006 | `/admin/schema` | 200 / heading "スキーマ差分" |
| TC-SMK-007 | `/admin/schema/history` | 200 / heading "差分履歴" |
| TC-SMK-008 | `/admin/requests` | 200 / heading "リクエスト" |
| TC-SMK-009 | `/admin/identity-conflicts` | 200 / heading "本人確認" |
| TC-SMK-010 | `/admin/audit` | 200 / heading "監査ログ" |
| TC-SMK-011 | `/admin` (API down 状態) | 200 (画面全停止しない) + `AdminSectionError` 文言 |

認証は `apps/web/playwright/fixtures/admin-session.ts` の既存 storageState を流用 (admin = `manjumoto.daishi@senpai-lab.com`)。

## 6. Fail path 想定

| 種別 | 発生源 | テストでの再現 |
| ---- | ---- | ---- |
| API 500 | `fetchAdmin` reject | `vi.mock` で `Promise.reject(new Error("HTTP 500"))` |
| API timeout | `AbortError` | `vi.mock` で `Promise.reject(new DOMException("aborted", "AbortError"))` |
| API 401 | 認証失効 | mock で `{ status: 401, message: "unauthorized" }` を throw |
| API 404 (detail) | `[id]` 存在しない | mock で notFound (`next/navigation`) を call |
| Network down | fetch そのものが throw | mock で `TypeError("Failed to fetch")` |
| Partial fail | 複数 fetch のうち 1 つだけ fail | section ごと degrade を assert |

## 7. Mock 戦略

| 対象 | 配置 | 方針 |
| ---- | ---- | ---- |
| `fetchAdmin<T>` | `apps/web/src/lib/__mocks__/fetchAdmin.ts` (vitest auto-mock) | デフォルトは throw、test ごとに `.mockResolvedValueOnce` で上書き |
| `useAdminMutation` | `apps/web/src/features/admin/hooks/__mocks__/useAdminMutation.ts` | `mutate` を `vi.fn()` で stub、`status` は test 側で `idle/pending/success/error` を切替 |
| `useConfirmDialog` | 同様 | `confirm` を `vi.fn().mockResolvedValue(true)` |
| `next/navigation` (`redirect`, `notFound`) | `vi.mock("next/navigation")` | throw `NEXT_REDIRECT` / `NEXT_NOT_FOUND` を再現 |
| `next/headers` (`cookies`, `headers`) | `vi.mock("next/headers")` | 認証 cookie の有無を切替 |
| Toast | `apps/web/src/components/ui/__mocks__/Toast.ts` | `useToast().push` を `vi.fn()` |

## 8. Visual regression 非依存

- Phase 4 / Phase 6 の自動テストは **DOM 構造 / aria 属性 / 文言 / token class 名** のみを assert する。
- pixel diff (screenshot) は Phase 11 で 4 viewport × 5 key screen = 20 枚を取得し別評価する。
- 自動テストが flaky 化しないよう、`screenshot()` API は本 Phase で禁止。

## 9. カバレッジ目標 (Phase 7 で実測)

| 対象 | line | branch | function | statement |
| ---- | ---- | ---- | ---- | ---- |
| `apps/web/src/features/admin/components/_shared/**` | **90%** | **85%** | 90% | 90% |
| 修正対象 page (変更ブロック差分) | **100%** | **90%** | 100% | 100% |
| `app/(admin)/layout.tsx` 変更ブロック | 90% | 85% | 90% | 90% |
| `app/(admin)/admin/error.tsx` 変更ブロック | 90% | 85% | 90% | 90% |

> 既存 (本タスクで変更しない) 行は対象外。`pnpm coverage --changed` ベースで実測する。

## 10. targeted vitest コマンド (FB-UI-02-2 対応)

全件実行は worker SIGKILL の原因になるため、本タスクの test は **file リスト指定** で実行する。

```bash
# _shared unit
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionCard.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminEmptyState.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminStat.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminTable.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/AdminQueuePanel.spec.tsx \
  apps/web/src/features/admin/components/_shared/__tests__/utils.spec.ts

# page degrade
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/app/\(admin\)/admin/page.spec.ts \
  apps/web/app/\(admin\)/admin/members/page.spec.ts \
  apps/web/app/\(admin\)/admin/tags/page.spec.ts \
  apps/web/app/\(admin\)/admin/meetings/page.spec.ts \
  apps/web/app/\(admin\)/admin/meetings/\[id\]/page.spec.ts \
  apps/web/app/\(admin\)/admin/schema/page.spec.ts \
  apps/web/app/\(admin\)/admin/schema/history/page.spec.ts \
  apps/web/app/\(admin\)/admin/requests/page.spec.ts \
  apps/web/app/\(admin\)/admin/identity-conflicts/page.spec.ts \
  apps/web/app/\(admin\)/admin/audit/page.spec.ts \
  apps/web/app/\(admin\)/admin/dashboard/attendance/page.spec.ts

# Playwright smoke
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/admin-routes-smoke.spec.ts \
  --project=chromium
```

## 11. Props vs Internal state 判定マトリクス (VSCPKR-03)

| Component | selected/active state | sort state | drawer open state | loading state |
| ---- | ---- | ---- | ---- | ---- |
| `AdminSectionCard` | — | — | — | — |
| `AdminSectionError` | — | — | — | — |
| `AdminEmptyState` | — | — | — | — |
| `AdminStat` | — | — | — | **prop** (`loading`) |
| `AdminTable` | — | **prop** (`sortKey/sortDir` + `onSort`) | — | **prop** (`loading`) |
| `AdminQueuePanel` | **prop** (`selectedId` + `onSelect`) | — | — | **prop** (`loading`) |

すべて controlled。internal `useState` は持たない。

## 12. DoD (Phase 4)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 4
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 5 実装を先に壊す test contract と visual smoke の対象を定義する。

## 実行タスク

- `_shared` 6 component の unit test を定義する
- page degrade と `safeServerFetch` の fail path を定義する
- Playwright smoke と screenshot evidence の境界を定義する

## 参照資料

- `phase-2-design.md`
- `phase-5-implementation.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`

## 成果物/実行手順

- TC-ID と対象 file を Phase 5 / 6 / 11 へ渡す

## 統合テスト連携

- Vitest targeted commands と Playwright smoke を Phase 9 / 11 の証跡に接続する

## 完了条件

- TC-ID、対象 file、期待結果、実行コマンドが揃っている

- [ ] 本 Phase 計画の TC 表 (TC-SC / TC-SE / TC-ES / TC-ST / TC-TB / TC-QP / TC-PG / TC-SMK) が確定している
- [ ] mock 戦略・コマンド・カバレッジ目標が明文化されている
- [ ] Phase 5 実装が本計画の TC を網羅できる test 配置を採用していること (Phase 5 で参照)
- [ ] Phase 11 の VISUAL 評価と Phase 4 の DOM 評価が **二重実装にならない** こと (本 Phase は visual を扱わない)
