[実装区分: 実装仕様書]

# Phase 4: テスト作成 (RED)

**依存**: Phase 3 (型定義 / Zod スキーマ / API モック契約) 完了
**目的**: Phase 5 実装前に全テストを RED 状態で確定し、テスト先行開発を担保する
**参照 SSOT**: `_shared-context.md` §1, §3, §4, §5, §7

---

## 1. テスト戦略（5層ピラミッド）

| 層 | 対象 | ランタイム | 目的 |
| -- | ---- | -------- | ---- |
| L1 Contract | API endpoint × Zod schema | `@vitest-environment node` + `setupD1()` | 認証 / 認可 / clamp / Zod strict 検証 |
| L2 Repository unit | 集計関数 (pure SQL) | node + 実 D1 sqlite | 境界値 / 半開区間 / deleted 除外 |
| L3 Component | React component (RTL) | `@vitest-environment happy-dom` | DOM / a11y / props 反応 |
| L4 Page integration | `AttendanceAnalyticsPage` server component | happy-dom + MSW server-fetch stub | データ集約 / partial failure degrade |
| L5 Playwright visual | screenshot diff | Chromium | 視覚回帰 |

**RED 完了基準**: 全テスト存在 + `pnpm -w test` で 1 件以上 fail（実装未着手のため）。

---

## 2. 命名規則整合確認チェックリスト（FB-01 対応）

`_shared-context.md` §5 と Phase 3 成果物の照合：

- [ ] テストファイル: `*.spec.ts` / `*.spec.tsx` のみ（`.test.*` 禁止）
- [ ] 識別子 camelCase（`computeAttendanceTrend`, `useAttendanceFilters`）
- [ ] Component PascalCase（`AttendanceAnalyticsPage`）
- [ ] Zod suffix `Z`（`AttendanceTrendZ`）
- [ ] API path kebab-case: `/admin/dashboard/attendance/zone-distribution`
- [ ] Error code `ADMIN_FETCH_[STATUS]`
- [ ] env var SCREAMING_SNAKE（`INTERNAL_API_BASE_URL`, `AUTH_SECRET`）
- [ ] テスト ID prefix `TC-AA-NNN`（後述 §5）
- [ ] テスト describe 文言は対象シンボル名と完全一致（grep 容易性）

CI lint: `scripts/lint-test-naming.sh`（既存があれば再利用、なければ Phase 5 で追加）。

---

## 3. private method テスト方針（FB P0-09-U1-1）

**原則**: private を直接テストせず、**公開関数経由で間接テスト**。例外時のみ `cast` 戦略。

| パターン | 採用条件 | 実装 |
| -------- | -------- | ---- |
| A: 公開 export 経由 | 公開 API で全分岐到達可能 | デフォルト |
| B: `__test__` named export | 純粋関数の境界値が公開 API から到達不能 | `export const __test__ = { fn }` |
| C: `as unknown as` cast | クラス private で B 不可 | `(instance as unknown as { fn: ... }).fn()` + 該当行に `// FB P0-09-U1-1: justified private access` コメント |

新規実装（`attendance-analytics.ts`）は**全て A で到達可能**になるよう public 関数を設計（Phase 3 で定義済み）。

---

## 4. テストファイル設計

### 4.1 `apps/api/src/repository/__tests__/attendance-analytics.spec.ts`

**対象**: `computeAttendanceTrend`, `computeZoneDistribution`, `listAbsentees`, `getSessionDetail`, 拡張版 `computeAttendanceOverview`

**Setup**: `setupD1()` → fixture seed (§6 参照)

| TC ID | 関数 | ケース | 期待 |
| ----- | ---- | ----- | ---- |
| TC-AA-R01 | `computeAttendanceTrend` | sessions 0件 | `buckets: []` |
| TC-AA-R02 | 同上 | 月跨ぎ 3 session | bucket 3 件、`period: 'YYYY-MM'` 昇順 |
| TC-AA-R03 | 同上 | 半開区間 [2026-01-01, 2026-02-01) で 2026-02-01 のセッション除外 | 1月分のみ |
| TC-AA-R04 | `computeZoneDistribution` | zone 全 4 種混在 | rate 合計 ≒ 1.0 (±0.001) |
| TC-AA-R05 | `computeZoneDistribution` | `member.deleted_at != NULL` 含む | active のみ集計 |
| TC-AA-R06 | `listAbsentees` | `lastN=3` で直近3 session 全欠席 | `missedCount: 3` |
| TC-AA-R07 | `listAbsentees` | 期間内 session 0件 | `[]` |
| TC-AA-R08 | `getSessionDetail` | 存在 session | `attendees + absentees = active members 総数` |
| TC-AA-R09 | `getSessionDetail` | 不存在 session | `null` |
| TC-AA-R10 | `computeAttendanceOverview` | `previousPeriodRate` 計算 | 前期間 [from-Δ, from) を比較 |
| TC-AA-R11 | 全関数 | `periodFrom > periodTo` | 空結果（throw しない、上位で clamp） |
| TC-AA-R12 | 全関数 | `zone=[]`（空配列） | 全 zone と同義 |

### 4.2 `apps/api/src/routes/admin/__tests__/attendance-analytics.contract.spec.ts`

**対象**: §3 の全 8 endpoint × 認証 / 認可 / clamp / period / zone / CSV

軸:
- **AUTH**: token なし → 401
- **AUTHZ**: `isAdmin: false` JWT → 403
- **CLAMP**: `limit=0` → 1, `limit=999` → 200, `limit=-5` → 1
- **PERIOD**: `periodFrom=invalid` → default fallback、半開区間検証
- **ZONE**: `zone=0→1,1→10` parse、unknown 値は無視
- **CSV**: `Content-Type: text/csv; charset=utf-8`, BOM 付き, header 行存在

| TC ID | endpoint | ケース | 期待 |
| ----- | -------- | ----- | ---- |
| TC-AA-C01〜C08 | 8 endpoint 各 | no token | 401 + `ADMIN_FETCH_401` |
| TC-AA-C09〜C16 | 8 endpoint 各 | non-admin | 403 + `ADMIN_FETCH_403` |
| TC-AA-C17〜C19 | overview / by-session / ranking | `limit=999` | response `limit: 200` |
| TC-AA-C20〜C24 | period 受け取る全 endpoint | `periodFrom=foo` | default fallback（200 + echo back） |
| TC-AA-C25 | trend | `granularity=week`（未対応） | default `month` fallback |
| TC-AA-C26 | zone-distribution | `periodFrom=2026-01-01&periodTo=2026-04-01` | 200 + Zod strict pass |
| TC-AA-C27 | sessions/:id/attendees | 不存在 id | 404 + `ADMIN_FETCH_404` |
| TC-AA-C28 | absentees | `lastN=10` | 200 |
| TC-AA-C29 | export | `format=csv` | `text/csv` + BOM (`﻿`) |
| TC-AA-C30 | export | `format=json` | 400 fallback or 200 JSON（仕様確定: 200 JSON） |
| TC-AA-C31 | 全 endpoint | response が `XxxZ.strict()` parse 成功 | extra key 0 |

### 4.3 `apps/web/src/features/admin/attendance/__tests__/*.spec.tsx`

happy-dom + React Testing Library + `vi.mock('next/navigation')`。

#### `AttendanceAnalyticsPage.spec.tsx`
- TC-AA-P01: 全 8 fetch 成功 → 全セクション render
- TC-AA-P02: trend のみ fail → `AdminSectionErrorClient` 1個 + 他セクション正常
- TC-AA-P03: overview fail → KPI 部のみ error、page error.tsx に throw しない
- TC-AA-P04: zone filter 0件選択 → 全 zone 同義として render

#### `AttendanceTrendChart.spec.tsx`
- TC-AA-T01: `buckets: []` → empty state 表示
- TC-AA-T02: 12 bucket → SVG path d 属性に座標が含まれる
- TC-AA-T03: tooltip aria-label

#### `SessionAttendanceTable.spec.tsx`
- TC-AA-S01: sort `held_on DESC, session_id DESC` 初期
- TC-AA-S02: ヘッダクリックで attendeeCount sort 切替
- TC-AA-S03: 行クリックで `onSelect(sessionId)` 発火

#### `AttendanceDrilldownModal.spec.tsx`
- TC-AA-D01: `open=false` → DOM 非存在
- TC-AA-D02: attendees + absentees 表示
- TC-AA-D03: Escape で `onClose` 呼出
- TC-AA-D04: focus trap（先頭要素に focus）

#### `useAttendanceFilters.spec.ts`
- TC-AA-H01: 初期値 `period: '3M'`
- TC-AA-H02: `setPeriod('1Y')` → URL searchParams 更新（router.push mock 検証）
- TC-AA-H03: zone トグル
- TC-AA-H04: URL ← params 復元（hydration）

### 4.4 `apps/web/playwright/tests/visual/admin-attendance.spec.ts`

- TC-AA-V01: 初期表示 full page screenshot（viewport 1280x800）
- TC-AA-V02: period=1Y 適用後
- TC-AA-V03: zone=0→1 のみ
- TC-AA-V04: drilldown modal open

`expect(page).toHaveScreenshot('admin-attendance-initial.png', { maxDiffPixelRatio: 0.01 })`

---

## 5. テストケース ID / EC / SD 採番

- **TC-AA-NNN**: Test Case（AA = Admin Attendance）
  - R01-R12: Repository
  - C01-C31: Contract
  - P01-P04: Page
  - T01-T03: Trend
  - S01-S03: Session table
  - D01-D04: Drilldown
  - H01-H04: Hook
  - V01-V04: Visual
- **EC-NNN**: Edge Case（境界値）
  - EC-001: period 半開 (2026-02-01 00:00:00 含めない)
  - EC-002: limit clamp 上限 200
  - EC-003: zone unknown 文字列
  - EC-004: deleted_at member 除外
  - EC-005: sessions 0件
- **SD-NNN**: Security Defect（認可）
  - SD-001: no token
  - SD-002: non-admin JWT
  - SD-003: session id traversal (`../`)

---

## 6. 期待値計算根拠（fixture 手計算）

**Fixture** (`apps/api/src/test/fixtures/attendance-analytics.ts`):

```
members: m1 (zone=0→1), m2 (zone=1→10), m3 (zone=10→100), m4 (zone=0→1, deleted_at=2026-01-15)
sessions:
  s1: held_on=2026-01-10, attendees=[m1, m2, m3, m4]
  s2: held_on=2026-01-20, attendees=[m1, m2]
  s3: held_on=2026-02-05, attendees=[m1]
```

| 指標 | 期間 [2026-01-01, 2026-02-01) | 計算 |
| ---- | --------------------------- | ---- |
| 総 session | 2 (s1, s2) | held_on で filter |
| active members | 3 (m4 deleted) | deleted_at IS NULL |
| 出席延べ | s1=3 (m4除く) + s2=2 = 5 | active のみ |
| 平均出席数 | 5 / 2 = 2.5 | |
| 全体出席率 | 5 / (2 × 3) = 0.8333 | |
| unique 出席 | m1, m2, m3 = 3 | |
| TOP1 | m1 (2回) / m2 (2回) tie → memberId ASC | m1 |
| absentees (lastN=2) | s1, s2 両欠席の active = 0 | m3 は s1 出席 |
| zone-distribution | 0→1: 1(m1) / 1→10: 1(m2) / 10→100: 1(m3) | rate = each / 3 ≒ 0.333 |
| trend bucket (month) | 2026-01: attendeeCount=5, sessionCount=2, uniqueMemberCount=3 | |
| previousPeriodRate | 前 1ヶ月 [2025-12-01, 2026-01-01) sessions=0 → null | |

---

## 7. happy-dom での `vi.stubGlobal("window")` 禁止（FB VSCPKR-02）

- 各 `*.spec.tsx` の冒頭に必ず `// @vitest-environment happy-dom`
- `vi.stubGlobal('window', ...)` / `vi.stubGlobal('document', ...)` 一切禁止
- window API mock が必要な場合は `Object.defineProperty(window, 'matchMedia', { value: vi.fn(...) })` を `beforeEach` で実施し `afterEach` で restore
- lint: `rg "vi\.stubGlobal\(['\"](window|document)" apps/web/src` が 0 件を CI で検証

---

## 8. props vs internal state の区別（FB VSCPKR-03）

各 component テストの先頭に区分表をコメントで明記：

```tsx
// === props ===
// - data: AttendanceTrend (parent provided, immutable in test)
// - onSelect: (id) => void (parent provided)
// === internal state ===
// - hoveredBucket: string | null (useState, NOT to be tested directly)
// - 操作: user event 経由でのみ間接検証
```

internal state を `rerender` で直接 inject するテストを禁止。

---

## 9. 境界値文字列の `.length` コメント（FB W0-RV-001）

CSV BOM / 日付フォーマット / zone label など境界値は length をコメント：

```ts
expect(csv.slice(0, 1)).toBe('﻿'); // length=1 (BOM)
expect(periodFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/); // length=10 (YYYY-MM-DD)
expect(zoneLabel).toBe('0→1'); // length=3 (1+1+1, fullwidth arrow=1ch)
```

---

## 10. 依存関係整合確認（FB-MSO-002 相当）

Phase 4 着手前に**必ず**実行：

```bash
pnpm install --frozen-lockfile
pnpm --filter @repo/shared build
pnpm --filter @ubm-hyogo/api build  # 型解決確認
pnpm --filter @ubm-hyogo/web typecheck
```

`@repo/shared` の dist が古いと型エラーで RED にならず confusing fail になるため、テスト書き始め前に dist 更新必須。

確認チェックリスト：
- [ ] `packages/shared/dist/zod/admin-attendance.d.ts` が Phase 3 成果物を反映
- [ ] `pnpm why @repo/shared` で workspace link 確認
- [ ] node_modules/.cache/vitest 削除（古い transform cache 回避）

---

## 11. 実行コマンド一覧

```bash
# 個別
pnpm --filter @ubm-hyogo/api test -- attendance-analytics
pnpm --filter @ubm-hyogo/web test -- attendance
pnpm --filter @ubm-hyogo/web playwright test admin-attendance --update-snapshots=none

# 全体（RED 確認）
pnpm -w test 2>&1 | tee /tmp/phase4-red.log
grep -E "(FAIL|Tests:.*failed)" /tmp/phase4-red.log

# Visual baseline は Phase 5 で生成（このフェーズでは未生成で OK）
```

---

## 12. RED フェーズ完了判定

以下を**全て**満たした時点で Phase 4 完了 → Phase 5 (GREEN) へ：

1. §7 のテストファイル 8 本が全て存在し、`git status` で untracked or modified
2. `pnpm -w test` 実行で **新規追加テストのうち 1 件以上が fail**（既存テストは全てグリーン維持）
3. 失敗理由が **「実装未着手」or「型未定義」** のみ（テスト自体の構文/import エラー禁止）
4. 各 spec ファイルの先頭に対応 TC-AA-NNN コメント
5. fixture (`apps/api/src/test/fixtures/attendance-analytics.ts`) が §6 と一致
6. §2 命名チェック / §7 stubGlobal 禁止 / §8 props 区分 / §9 length コメント / §10 依存関係確認 全 OK
7. `pnpm -w lint` グリーン（テストコード単体 lint）
8. Phase 4 成果物コミット message: `test(admin-attendance): RED phase - add failing specs for analytics endpoints/components`

完了後、Phase 5 仕様書 SubAgent に handoff（artifacts.json に test file パス一覧を追記）。
