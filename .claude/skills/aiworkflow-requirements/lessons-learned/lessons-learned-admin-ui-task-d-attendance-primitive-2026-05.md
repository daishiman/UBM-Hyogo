# Lessons Learned — admin-ui Task D attendance primitive conformance（2026-05-26）

> task: `admin-ui-task-d-attendance-primitive-conformance`
> 関連 spec: `docs/30-workflows/completed-tasks/admin-ui-task-d-attendance-primitive-conformance/`、親 `docs/30-workflows/admin-ui-prototype-alignment/tasks/task-D-attendance-primitive-conformance.md`
> 関連 source: `apps/web/app/(admin)/admin/dashboard/attendance/{page.tsx, AttendanceDashboardSections.client.tsx, __tests__/page.spec.tsx}`、`apps/web/src/features/admin/components/index.ts`、`scripts/verify-primitive-adoption.sh`、`apps/web/playwright/{fixtures/auth.ts, tests/admin-attendance-dashboard.spec.ts}`

## 苦戦箇所と教訓

### L-TASKD-001: AdminTable の `accessor` / `render` / `getRowKey` 関数 props は client island に閉じ込める

- **背景**: page.tsx を Server Component で保持しつつ AdminTable へ column 定義を渡そうとすると、`render: (row) => <Foo />` のような関数 props が Server→Client serialization の境界に置けず、build / runtime で fail する。
- **教訓**: AdminTable を使うセクションは page.tsx (`Server`) と separate な `*.client.tsx` (`"use client"`) に分割し、page.tsx は data fetch (`safeServerFetch`) と `AdminPageHeader` 描画のみに縮退させる。column の `accessor` / `render` / `getRowKey` 関数 props は client component 内 const として定義する。
- **将来アクション**: AdminTable / 関数 props を含む primitive を採用する UI タスクは Phase 2 設計で「page.tsx vs `*.client.tsx` の責務分離」を必ず deliverable に含める。

### L-TASKD-002: `KpiGrid` は dashboard totals 固定型のため流用不可、`KpiCard` 直置きで構成する

- **背景**: 「KPI 3 枚並び」を実現するため当初 `KpiGrid` を選んだが、`KpiGrid` は `AdminDashboardView["totals"]` を引数に取る closed schema で attendance metrics に対応できない。schema 拡張は範囲外。
- **教訓**: primitive を「型シグネチャ」だけ見て選ばない。closed input schema を持つ wrapper primitive は extension せず、その下位 primitive (`KpiCard`) を直置きする。Phase 2 で primitive 候補を列挙する際は `props signature` と `input schema 開放度` を併記する。
- **将来アクション**: `task-specification-creator` の Phase 2 primitive 採択 template に「primitive の input schema が closed か open か」列を必須化する。

### L-TASKD-003: `AdminEmptyState` に `testId` prop は存在しない — 固定 `data-testid` と表示文言で検証する

- **背景**: 空状態の Playwright assert を書くため `<AdminEmptyState testId="..." />` を仕様化したが、現行 API には `testId` prop が無く typecheck fail。
- **教訓**: primitive contract は仕様文書ではなく **現行 `apps/web/src/features/admin/components/_shared/*.tsx` の実 API** が正本。Phase 2 設計時に primitive ソースを必ず開き、props を逐語 copy する。新規 prop の追加は別タスクへ切り出し、現タスクは固定 `data-testid` + 表示文言で検証する。
- **将来アクション**: primitive 採用タスクは Phase 2 deliverable に「primitive 実 API snapshot（barrel export + props 型）」を必須化。

### L-TASKD-004: `_shared` primitive の barrel export は追記方式で再 export し、既存 import 経路を破壊しない

- **背景**: `AdminTable` / `AdminEmptyState` / `AdminSectionErrorClient` を attendance client island から import する際、`@/features/admin/components/_shared/...` 直接参照と `@/features/admin/components` barrel 経由の混在が発生しうる。
- **教訓**: `apps/web/src/features/admin/components/index.ts` の barrel に **追記方式（既存行を壊さず append）** で re-export を追加し、新規 import を barrel 経由に統一する。既存呼び出しは触らない。
- **将来アクション**: primitive 採用タスクの Phase 5 implementation step に「barrel に追記の re-export を 1 行ずつ追加」を default 化する。

### L-TASKD-005: Playwright mock API は `apps/web/playwright/fixtures/auth.ts` に scenario として追記し `PLAYWRIGHT_EVIDENCE_DIR` で evidence を分離する

- **背景**: Phase 11 screenshot 取得時、attendance 3 状態（all-ok / overview-error / by-session-empty）の API レスポンスを切り替える必要があり、本番 API には依存できない。さらに screenshot を workflow root 配下に書き出したいが Playwright のデフォルト出力先はリポジトリ root。
- **教訓**: in-process fixture (`apps/web/playwright/fixtures/auth.ts`) に scenario header (`x-mock-scenario`) を読む handler を追記し、env `PLAYWRIGHT_EVIDENCE_DIR` で screenshots dir を上書きする。spec 側は `process.env.PLAYWRIGHT_EVIDENCE_DIR ?? "test-results"` で resolve する。
- **将来アクション**: Phase 11 visual evidence を取得する UI タスクの spec template に「mock fixture handler 追記」「`PLAYWRIGHT_EVIDENCE_DIR` 経由の evidence 分離」を 2 行で含める。

### L-TASKD-006: `verify-primitive-adoption.sh` の grep gate に **page 単位 C7** を追加して primitive 採用回帰を即検出する

- **背景**: 当 task では `/admin/dashboard/attendance` の primitive 採用を「`AdminPageHeader` を使い、裸 `<table>` を使わず、inline KpiCard を撤去する」を AC とした。これを将来 regression させない gate が無い。
- **教訓**: `scripts/verify-primitive-adoption.sh` に当 page 専用の grep gate (C7) を追加する。pattern は `<table` / `inline className="kpi-..."` 等の anti-pattern が **当 page だけ** に出現していないことを確認する形（page path で scope する）。
- **将来アクション**: primitive 採用タスクは Phase 6 quality gate で「page-scoped grep gate を verify-primitive-adoption.sh に 1 案件 1 number で追記」を default 化する。
