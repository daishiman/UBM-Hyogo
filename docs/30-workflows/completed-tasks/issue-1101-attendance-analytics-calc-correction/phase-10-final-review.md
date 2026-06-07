# Phase 10: 最終レビュー

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 前提: Phase 1（AC-1..AC-8）/ Phase 2（enum・rate・SQL 設計）/ Phase 3（設計レビュー PASS・GO）/ Phase 4（テスト計画 RED）/ Phase 5-9（実装・テスト追加・カバレッジ・リファクタ・QA）
- workflow_state: `implemented_local_evidence_captured`（実コード・focused tests・正本仕様同期まで完了。commit / PR / staging visual は user-gated）
- visualEvidence: `VISUAL`（KPI タイル 1 件追加・label 文言変更のみ。視覚確認は Phase 11 で user-gated runtime として実施）
- 本 Phase の責務: AC-1..AC-8 の達成判定基準（チェックリスト）を確定し、ブロッカー判定・MINOR 追跡・consumer wiring 完結を再確認したうえで「仕様書として PASS（実装着手可）」を判定する

## 目的

Phase 1〜9 の成果（要件・設計・テスト計画・QA gate）が AC-1..AC-8 へ漏れなく trace され、実コード反映で green 化することを最終確認する。
各 AC の判定は **`implemented_local_evidence_captured`**（ローカル実装・focused test PASS）を基本とし、視覚確認に依存する項目（unique KPI タイルの実描画）は Phase 11 の **`runtime_pending`** を併記する。

## 実行タスク

### 1. AC-1..AC-8 達成判定基準（チェックリスト・3-state 判定）

判定語彙: `implemented_local_evidence_captured`（ローカル実装・focused test PASS） / `runtime_pending`（staging 視覚確認が user-gated で未実施）。

| AC | 達成判定基準（チェックリスト） | 検証手段（Phase） | 判定 |
| --- | --- | --- | --- |
| AC-1 zone 境界バグ是正 | [ ] `zoneFromCount(100)` / `(1000)` が `zone_100_plus`<br>[ ] `zoneFromCount(-1)` / `(NaN)` / `(Infinity)` のみ `unknown`<br>[ ] 旧 `expect(...(100)).toBe("unknown")` テストが新値へ是正済み | Phase 9 タスク 2（internals spec） | `implemented_local_evidence_captured` |
| AC-2 旧矢印 enum 除去 + normalize 互換 | [ ] `AttendanceZoneZ` enum メンバーに旧矢印値が無い<br>[ ] `normalizeZone("0→1")` → `zone_0` 等の互換テストが存在<br>[ ] grep gate で旧矢印値が `LEGACY_ZONE_MAP` 以外にゼロ | Phase 9 タスク 2 / タスク 3（grep gate） | `implemented_local_evidence_captured` |
| AC-3 rate 定義の 4 面一致 | [ ] `overallRate`（延べ率 = 延べ出席 / `totalSessions×totalMembers`）<br>[ ] `uniqueAttendeeCount`（`COUNT(DISTINCT member_id)`）<br>[ ] `uniqueAttendanceRate`（unique / totalMembers, 0..1 clamp）<br>[ ] code / schema / doc / UI ラベルで定義一致 | Phase 9 タスク 2（repository spec）+ タスク 5（doc） | `implemented_local_evidence_captured` |
| AC-4 enum ↔ 返り値集合一致 | [ ] `AttendanceZoneZ` の 5 キーと `zoneFromCount` 返り値が完全一致 | Phase 9 タスク 5 (1)(2) | `implemented_local_evidence_captured` |
| AC-5 web label 追従 | [ ] `ZONE_LABEL` が新 5 種（`unknown`=「分類不能」）網羅<br>[ ] `SELECTABLE_ZONES` が `unknown` を除く 4 種<br>[ ] `ZONE_HELP` が新境界と整合 | Phase 9 タスク 2（format spec）+ タスク 5 (3) | `implemented_local_evidence_captured` |
| AC-6 unique KPI consumer wiring | [ ] `KpiPanel` に `data-testid="attendance-kpi-unique"` タイル追加<br>[ ] `uniqueAttendanceRate` / `uniqueAttendeeCount` を consume（additive field 配線完結） | Phase 9 タスク 2（KpiPanel spec） | `implemented_local_evidence_captured` ／ 実描画は `runtime_pending` |
| AC-7 green | [ ] focused vitest（4 spec）PASS<br>[ ] `pnpm typecheck` exit 0<br>[ ] `pnpm lint` exit 0 | Phase 9 タスク 1 / タスク 2 | `implemented_local_evidence_captured` |
| AC-8 不変条件（差分ゼロ） | [ ] `git diff --name-only -- apps/api/migrations apps/api/src/routes` 空<br>[ ] Google Form schema 差分ゼロ | Phase 9 タスク 6 | `implemented_local_evidence_captured` |

> AC-6 の unique KPI タイルの「実 pixel 描画」は jsdom で検証不能なため、Phase 11 staging で **`runtime_pending`** として user-gated 確認する境界を残している。DOM 構造（testid・field consume）は spec で `implemented_local_evidence_captured`。

### 2. ブロッカー判定

| 判定対象 | 結果 | 根拠 |
| --- | --- | --- |
| 機能ブロッカー | **なし** | Phase 3 設計レビュー R1..R10 で全 PASS（R5 bind 順序は Phase 5 で手順固定）。AC-1..AC-8 はいずれも `apps/api` / `packages/shared` / `apps/web` / `docs` 内に閉じ、1 サイクル 1 PR で green 化可能（CONST_007） |
| 不変条件違反 | **なし** | D1 migration / endpoint / method / Form schema 不変（AC-8）。route 層非変更。test は `*.spec.ts(x)` のみ |
| 別ドメイン誤変更 | **なし** | Phase 9 grep gate + 別ドメイン非接触（git diff）で byZone.ts / AboutUbm.tsx / MemberFilters / SelectedFiltersBar 非変更を保証 |

**ブロッカー判定: GO（実装着手可）**。

### 3. MINOR 指摘の追跡テーブル（Phase 3 由来・未タスク化候補として Phase 12 へ引き継ぎ）

Phase 3 設計レビューで記録された MINOR を、未タスク化候補として Phase 12（`unassigned-task-detection.md`）へ current/baseline 分離で引き継ぐ。

| MINOR ID | 指摘内容 | 本タスクでの扱い | 未タスク化候補 | 解決確認 Phase |
| --- | --- | --- | --- | --- |
| M-1 | API filter parse 層（`parse-attendance-filter.ts`）での旧矢印 bookmark URL 救済は本タスク **scope 外**（Phase 2 §4）。AC-2 は repository `normalizeZone` の互換マッピング + テストで満たす | scope を repository 内 normalize に限定。parse 層の旧 URL 救済は実施しない | **候補**: 旧 bookmark URL（`?zone=0→1`）の後方互換が将来必要なら未タスク化。現状は `safeParse` fail → filter 無視（全件・実害なし） | Phase 12 |
| M-2 | `zone-distribution` endpoint の `zone_100_plus` 行が常時表示され、100+ 該当ゼロ期間に空バーが増える可能性。表示間引き（`unknown` 同様 count>0 で残す）を `zone_100_plus` にも適用するかは UI 判断 | 本タスクでは「全正常帯は常時表示・`unknown` のみ間引き」を踏襲 | **候補**: `zone_100_plus` の空バー間引きを UI 判断で導入するなら未タスク化 | Phase 12 |

> M-1 / M-2 は automation-30 再検証後に本サイクル内で解消した。M-1 は parse 層互換実装、M-2 は正常帯常時表示の設計判断として閉じる。

### 4. consumer wiring 完結確認（unique field の KpiPanel 表示）

additive field（`uniqueAttendeeCount` / `uniqueAttendanceRate`）が API → shared → web の一方向で **表示先まで配線完結** していることを確認する（[UT-W3] 漏れ防止）。

| 段 | 配線箇所 | 確認内容 | 判定 |
| --- | --- | --- | --- |
| 生成（API） | `computeAttendanceOverviewExt` | `uniqueAttendeeCount`（`COUNT(DISTINCT member_id)`）+ `uniqueAttendanceRate`（0..1 clamp）を算出 | `implemented_local_evidence_captured` |
| 契約（shared） | `AttendanceOverviewExtZ.extend(...).strict()` | required 2 field 追加・`.strict()` 維持で既存 passthrough 非破壊 | `implemented_local_evidence_captured` |
| 通過（route） | `apps/api/src/routes/admin/attendance.ts` | passthrough のみ・reshape なし → additive field がそのまま通る（非変更） | `implemented_local_evidence_captured` |
| 消費（web） | `KpiPanel.tsx` の `data-testid="attendance-kpi-unique"` タイル | `overview.uniqueAttendanceRate` / `overview.uniqueAttendeeCount` を表示 | `implemented_local_evidence_captured` ／ 実描画は `runtime_pending` |

> consumer wiring が KpiPanel まで到達しているため、追加 field が「schema にあるが誰も表示しない（dead field）」状態を回避できている（AC-6 充足）。

### 5. 不変条件の最終適合確認（CLAUDE.md）

| 不変条件 | 最終判定 | 根拠 |
| --- | --- | --- |
| #1 既存 API のみ・endpoint 追加 / D1 / Form 変更禁止 | ✅ 適合 | SELECT のみ（DISTINCT 1 列追加）・migration 無し・route 非変更。AC-8 で `git diff` 空を gate |
| #5 D1 直接アクセスは `apps/api` に閉じる | ✅ 適合 | unique 集計は `attendance-analytics.ts`（apps/api）内。`apps/web` は overview fetch 経由のみ・新規 D1 アクセスなし |
| #8 test は `*.spec.*` のみ | ✅ 適合 | 変更/追加 test は `attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` / `format-attendance.spec.ts` / `KpiPanel.spec.tsx`。`*.test.*` 不使用 |
| #9 admin form input は FormField 経由 | ✅ 影響なし | KPI タイルは表示コンポーネント・新規 `<input>` 追加なし |
| 別ドメイン非変更（成長フェーズ zone） | ✅ 適合 | Phase 9 grep gate + git diff 非接触で byZone.ts / AboutUbm.tsx / MemberFilters / SelectedFiltersBar 不変 |

### 6. 実装サイクルで green 化すべき項目（TDD Red → Green の対象）

Phase 4 §RED 期待結果に対応し、後続実装で green へ転じる対象を一覧化する。

| 対象 | Red の理由（実装前 fail） | Green 化の実装 | 対応 AC |
| --- | --- | --- | --- |
| `zoneFromCount(100)` → `zone_100_plus` | 現行 `count > 99 → "unknown"` で `unknown` 返却 | 最終 else を `zone_100_plus` へ是正 | AC-1 |
| `zoneFromCount(-1)`/`NaN` → `unknown` | 現行は分岐順により高頻度帯と混在 | `!Number.isFinite \|\| count < 0` を先頭ガードへ | AC-1 |
| `normalizeZone("0→1")` → `zone_0` | 現行に `normalizeZone` 互換マッピング無し | `LEGACY_ZONE_MAP` 定数 + `?? "unknown"` | AC-2 |
| `AttendanceZoneZ` 新 5 キー | 現行 `z.enum(["0→1","1→10","10→100","unknown"])` | 新 5 キー enum へ再設計 | AC-2/AC-4 |
| `uniqueAttendeeCount` / `uniqueAttendanceRate` | 現行 overview に unique field 無し | `AttendanceOverviewExtZ` additive + SQL DISTINCT 集計 | AC-3 |
| `ZONE_LABEL` 新 5 値 | 現行 `ZONE_LABEL.unknown="100 回以上"`（UI 暫定補正） | 新 5 キー label へ（`unknown`=「分類不能」） | AC-5 |
| `data-testid="attendance-kpi-unique"` | 現行 KpiPanel に unique タイル無し | unique KPI タイル追加（5 タイル化） | AC-6 |
| doc `>=100 → zone_100_plus` | 現行 doc が `>=100 → unknown`（バグ転写） | doc を新境界 / unique 定義 / response shape へ更新 | AC-3 |

> いずれも `apps/api` / `packages/shared` / `apps/web` / `docs` 内に閉じ、1 つの実装サイクルで green 化可能。実装後に Phase 9 の focused vitest / gate で全 PASS を確認する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-1-requirements.md` | AC-1..AC-8 定義・別ドメイン境界 |
| 設計正本 | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-2-design.md` | enum / rate / SQL / 4 面一致マップ |
| 設計レビュー | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-3-design-review.md` | R1..R10 PASS・MINOR（M-1/M-2）・GO 判定 |
| QA | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-9-qa.md` | grep gate・4 面一致確認・AC マッピング |
| リファクタ | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-8-refactor.md` | `LEGACY_ZONE_MAP` 集約・zone 列挙 DRY 化 |
| artifacts | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/artifacts.json` | gates / phase 状態 |

### システム仕様（aiworkflow-requirements）

> 実装着手時に以下のシステム仕様を再確認し、既存設計との整合性を維持する。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 10 仕様書 | 文書 | AC-1..AC-8 達成判定基準（3-state）・ブロッカー判定・MINOR 追跡（M-1/M-2）・consumer wiring 完結・不変条件適合・green 化対象一覧 |
| 最終判定 | 判定 | 仕様書として PASS（実装着手可） |

## 統合テスト連携

- 本 Phase の AC トレースが Phase 12 `phase12-task-spec-compliance-check.md` の 4 条件 verdict / AC trace 節と一致すること。
- MINOR（M-1/M-2）が Phase 3 → Phase 10 → Phase 12 で一貫して 2 件記録されていること。
- 「実装サイクルで green 化すべき項目」が Phase 4 RED 期待結果・Phase 9 focused vitest と 1:1 で対応していること。
- Phase 11（視覚）の unique KPI タイル `runtime_pending` 行が user-gated として本改善サイクルへ引き継がれること。

## 最終判定

**仕様書として PASS（実装着手可）**。

- AC-1..AC-8 がすべて `implemented_local_evidence_captured` として trace 済み。視覚依存（AC-6 の実描画）は Phase 11 `runtime_pending` を明示して境界化。
- ブロッカー指摘なし（GO）。Phase 3 R1..R10 全 PASS（R5 bind 順序は Phase 5 で手順固定）。
- MINOR（M-1: parse 層旧 URL 救済 scope 外 / M-2: `zone_100_plus` 行常時表示）を未タスク化候補として Phase 12 へ引き継ぎ記録。
- consumer wiring（unique field → KpiPanel 表示）が配線完結し、dead field を回避（AC-6）。
- 不変条件 #1/#5/#8/#9 + 別ドメイン非変更に最終適合。

## 完了条件

1. AC-1..AC-8 が 3-state 語彙（`implemented_local_evidence_captured` / `runtime_pending`）で達成判定基準（チェックリスト）と共に trace されていること。
2. ブロッカー判定（機能 / 不変条件 / 別ドメイン誤変更）が「なし → GO」で記録されていること。
3. MINOR（M-1 / M-2）が Phase 12 で解消済みとして記録されていること。
4. consumer wiring（unique field の KpiPanel 表示）の配線完結が API→shared→route→web の 4 段で確認されていること。
5. 不変条件 #1/#5/#8/#9 + 別ドメイン非変更の最終適合が確認されていること。
6. 最終判定が「仕様書として PASS（実装着手可）」であること。
