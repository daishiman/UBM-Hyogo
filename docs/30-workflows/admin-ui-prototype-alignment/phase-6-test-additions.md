---
実装区分: 実装仕様書
状態: completed
Phase: 6
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-5-implementation.md](./phase-5-implementation.md)
次: [phase-7-coverage.md](./phase-7-coverage.md)
---

# Phase 6: テスト拡充

## 1. 目的

Phase 4 で計画した TC を Phase 5 実装と並走で実装し終わった時点を起点に、以下を追加する。

1. 既存 task-15 / task-16 / task-17 の admin 関連 test (`apps/web/src/components/admin/**/*.spec.tsx` 等) が **regression していない** ことを担保する追加 assert
2. fail path (API 500 / timeout / 401 / partial fail) の網羅
3. Playwright smoke の degrade case (admin 全体での障害時挙動) 追加
4. `safeServerFetch` の境界条件テスト

screenshot / visual regression は **Phase 11 で扱う** ため本 Phase では実装しない。

## 2. Regression test (既存 test との整合)

### 2.1 対象既存 test

| Path | 想定影響 |
| ---- | ---- |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.spec.tsx` | `AdminQueuePanel` ラッパー化により内部 DOM 変化 |
| `apps/web/src/components/admin/__tests__/TagsQueueResolveDrawer.spec.tsx` | `FormField` 統一による input 構造変化 |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.spec.tsx` | `AdminSectionCard` 包接で root が `<section>` 化 |
| `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.spec.tsx` | 同上 |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.spec.tsx` | wrapper 化に伴う DOM 変更 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.spec.tsx` | wrapper 化 |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | token class 変更 |
| `apps/web/src/components/admin/__tests__/MeetingPanel.spec.tsx` | wrapper 化 |
| `apps/web/src/features/admin/components/_dashboard/__tests__/*.spec.tsx` | KPI primitive 変更 |

### 2.2 追加方針

各既存 spec に「**プロトタイプ整合性 assert**」セクションを追加:

- root に `data-tone` 属性が存在 (token 整合)
- HEX class が含まれない (`expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}/)`)
- `AdminSectionCard` / `AdminQueuePanel` の barrel import が解決される

DOM が変わって既存 query selector が落ちる場合は **テストを壊さず query を更新** する (実装側を旧 DOM に戻すのは不可)。

## 3. Fail path 追加

`apps/web/app/(admin)/admin/page.spec.ts` に追加:

| TC | 入力 | 期待 |
| ---- | ---- | ---- |
| TC-FAIL-001 | dashboard fetch 500 / activity 正常 / queues 正常 | KPI section のみ `AdminSectionError`、その他正常 |
| TC-FAIL-002 | 3 種全て 500 | 3 section ともに `AdminSectionError`、shell / sidebar は健全 |
| TC-FAIL-003 | dashboard timeout (AbortError) | timeout 文言 + errorId 表示 |
| TC-FAIL-004 | 401 | `redirect("/login?from=/admin")` ではなく per-section に「認証が切れています」message (page render を保つ) |
| TC-FAIL-005 | network down (TypeError) | message に "ネットワーク" 文言 |

他 page (`members`, `tags`, `meetings`, `schema`, `requests`, `identity-conflicts`, `audit`, `attendance`) にも同等の 1 ケース (API fail → section degrade) を **最低 1 件ずつ** 追加。

## 4. `safeServerFetch` 境界条件

`apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts`:

| TC | 入力 | 期待 |
| ---- | ---- | ---- |
| TC-SF-001 | 200 + JSON | `{ ok: true, value }` |
| TC-SF-002 | 500 + text body | `{ ok: false, error, errorId }` (errorId は uuid-like) |
| TC-SF-003 | 401 | `{ ok: false, error: Error("unauthorized"), errorId }` |
| TC-SF-004 | 404 | `{ ok: false, ... }` (notFound には変換しない方針) |
| TC-SF-005 | timeout (AbortSignal) | `{ ok: false, error.name === "AbortError" }` |
| TC-SF-006 | invalid JSON | `{ ok: false, error: SyntaxError }` |
| TC-SF-007 | 同 path への 2 連続 call | errorId はそれぞれ独立 (collision なし) |

## 5. Playwright smoke 追加 case

`apps/web/playwright/tests/admin-routes-smoke.spec.ts` に追加:

| TC | シナリオ | 期待 |
| ---- | ---- | ---- |
| TC-SMK-DEG-001 | `/admin` で API mock を 500 に切替 → 再 visit | 200 表示 + "セクションを表示できませんでした" 文言 + sidebar 健全 |
| TC-SMK-DEG-002 | `/admin` で API mock を 401 に切替 | 200 表示 + 認証導線文言 |
| TC-SMK-NAV-001 | sidebar の 8 link を順に click | 各 route 200 + heading 一致 |

mock は `apps/web/playwright/fixtures/admin-api-mock.ts` (新規 or 既存) で route intercept する。

## 6. Mock helper 拡充

| 追加 | 配置 | 用途 |
| ---- | ---- | ---- |
| `mockFetchAdminFailure(status, message)` | `apps/web/src/lib/__mocks__/fetchAdmin.ts` | テスト側で 1 行で fail 状態を組める |
| `mockFetchAdminTimeout()` | 同上 | AbortError 再現 |
| `mockSafeServerFetch(results)` | 新規 | page test で section ごとに ok/fail を切替 |

## 7. ガード方針 (false positive 抑制)

- `expect().toMatchSnapshot()` 系は **使わない**。snapshot 起因の flaky を回避。
- DOM assert は **role / accessibility name** ベースを優先 (`getByRole("button", { name: "再試行" })`)。
- errorId は値そのものではなく `expect(...).toMatch(/^[0-9a-f-]+$/)` のような正規表現で assert。

## 8. DoD (Phase 6)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 6
- workflow_state: `implemented_local_runtime_pending`

## 目的

Phase 5 実装後に不足した regression / fail path test を追加する。

## 実行タスク

- 既存 test との重複を避けて fail path を追加する
- `safeServerFetch` の境界条件を網羅する
- Playwright smoke の追加 case を固定する

## 参照資料

- `phase-4-test-plan.md`
- `phase-5-implementation.md`

## 成果物/実行手順

- 追加 test file と TC-ID を Phase 7 coverage と Phase 9 QA の入力にする

## 統合テスト連携

- `safeServerFetch.spec.ts` TC-SF-001..007 と page degrade specs を coverage 測定へ接続する

## 完了条件

- 追加 test が false positive を避け、実装対象の fail path を検証している

- [ ] 既存 admin 関連 spec の regression 追加 assert 全 PASS
- [ ] TC-FAIL-001..005 を各 page で実装し全 PASS
- [ ] `safeServerFetch.spec.ts` TC-SF-001..007 全 PASS
- [ ] Playwright TC-SMK-DEG/NAV PASS
- [ ] snapshot 使用 0 件 (`grep -rn 'toMatchSnapshot' apps/web/src` で 0)
- [ ] 本 Phase で screenshot 系 API を使っていないこと
