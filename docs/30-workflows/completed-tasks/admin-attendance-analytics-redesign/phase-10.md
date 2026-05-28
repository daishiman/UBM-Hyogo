[実装区分: 実装仕様書]

# Phase 10: 最終レビュー（Final Review / Gate to Phase 11）

> 依存: **Phase 9（実機検証＋フィードバック反映）完了**を前提とする。Phase 9 で残った CRITICAL / MAJOR があれば本 Phase は実行せず該当 Phase に差し戻す。
> 後続: Phase 11（VISUAL: 実機スクショ・動画送付） → Phase 12（unassigned-task formalize / PR 仕上げ）。

## 0. 目的

Phase 1〜9 の成果物が `_shared-context.md` §9 DoD と正本仕様を満たすかを **形式的に判定** し、Phase 11 への進行可否を決定する。MINOR 残課題は本 Phase でクローズせず、Phase 12 で unassigned-task として formalize する方針を確定させる。

## 1. 入力

- `_shared-context.md` §3〜§9（特に §9 DoD、§4 正本仕様チェックリスト）
- `outputs/phase-2/` 〜 `outputs/phase-9/` の全アウトプット
- `artifacts.json`（Phase 別生成物 index）
- Phase 9 検証ログ: `outputs/phase-9/verification-result.md`
- フィードバックチケット: `FB-CANCEL-004-1`（404 fix）/ `FB-CANCEL-004-2`（関連）
- 既存 attendance 関連未完タスク一覧（`docs/30-workflows/*` の `index.md` を grep）

## 2. 受入条件チェック（shared-context §9 を全項目評価）

| # | DoD 項目 | 判定方法 | 判定 (PASS/FAIL/N/A) | 根拠 (artifact path / 行) |
| --- | --- | --- | --- | --- |
| 1 | staging で `/admin/dashboard/attendance` が 404 なし表示 | Phase 9 staging E2E ログ / 実機 curl 200 | | |
| 2-a | KPI 4枚表示 | Playwright `admin-attendance.spec.ts` screenshot | | |
| 2-b | 期間フィルタ動作 (今月/3M/6M/1Y/All) | `AttendancePeriodFilter.spec.tsx` + 実機 | | |
| 2-c | 区画フィルタ (0→1 / 1→10 / 10→100) | `AttendanceZoneFilter.spec.tsx` + 実機 | | |
| 2-d | トレンドグラフ | `AttendanceTrendChart.spec.tsx` | | |
| 2-e | セッションテーブル（ソート / 行クリック） | `SessionAttendanceTable.spec.tsx` | | |
| 2-f | メンバーテーブル（出席率/連続/最終列） | `MemberAttendanceTable` vitest | | |
| 2-g | TOP10 ランキング | コンポーネント vitest | | |
| 2-h | ドリルダウン Modal | `AttendanceDrilldownModal.spec.tsx` | | |
| 2-i | 欠席アラート | `AttendanceAbsenteeAlert` vitest | | |
| 2-j | CSV エクスポート | `attendance-export` contract + 実機 download | | |
| 3 | 全 contract / vitest / Playwright グリーン | `pnpm -w test` 出力 | | |
| 4 | `01-api-schema.md` 反映 & Zod 一致 | doc diff + `pnpm --filter shared test` | | |
| 5 | `pnpm -w lint && pnpm -w build && pnpm -w test` グリーン | Phase 8 CI ログ | | |
| 6 | 実機確認動画/スクショ送付 | **Phase 11 で実施** | N/A | Phase 11 担当 |
| 7 | PR description が変更点網羅 | **Phase 12 で実施** | N/A | Phase 12 担当 |

> #6/#7 は本 Phase の責務外（N/A）。それ以外 (#1〜#5) が **全て PASS** で `final_review_result = APPROVED`。1 つでも FAIL なら `BLOCKED`。

### 2.1 §4 正本仕様遵守チェック（再確認）

§4 の 12 項目を Phase 5/6/7/8 のレビュー結果から転記し PASS/FAIL を確認。FAIL 1 件以上で **CRITICAL** 扱い。

## 3. Blocker 判定ルール

| severity | 定義 | 本 Phase での扱い |
| --- | --- | --- |
| CRITICAL | DoD #1〜#5 のいずれか FAIL / §4 正本仕様違反 / セキュリティ後退 / 既存機能 regression | **差し戻し**: 該当 Phase 番号 + 修正指示を `final-review-result.md` §Blockers に記載 → Phase 11 進行不可 |
| MAJOR | DoD は満たすが UX/性能/可読性で重大な改善余地（例: 主要画面 LCP > 4s、a11y violation high） | **差し戻し or 条件付き承認**: 1 件以上で原則差し戻し。例外的に Phase 11 と並行修正可とする場合は理由を明記 |
| MINOR | 命名揺れ / コメント不足 / 軽微なリファクタ余地 / 非クリティカルな改善案 | **差し戻さず unassigned-task 化**（§5 参照） |

判定優先順位: **CRITICAL > MAJOR > MINOR**。CRITICAL/MAJOR が残存する限り `phase_11_ready = false`。

## 4. partial_fix 検出（FB-CANCEL-004-1）

**目的**: 「404 を直した」が API 層 / repository 層のみで終わり、Web consumer (server-fetch / page.tsx / features 配下) まで配線が到達していない `partial_fix` を検出する。

### 4.1 検出手順

1. `outputs/phase-6/api-impl-summary.md` から 404 修正コミット範囲を抽出（変更ファイル一覧）。
2. 次の **consumer wiring chain** が全て更新されているか確認:
   - `apps/api/src/routes/admin/dashboard.ts` (or 新規 route ファイル) でルート登録
   - `apps/api/src/index.ts` の `app.route()` に追加
   - `packages/shared/src/zod/admin-attendance.ts` の Zod schema export
   - `packages/shared/src/types/admin-attendance.ts` の TS re-export
   - `apps/web/src/lib/admin/fetch-attendance.ts`（または `server-fetch.ts`）で `safeServerFetch<T>()` 呼び出し
   - `apps/web/app/(admin)/admin/dashboard/attendance/page.tsx` で Server Component が新 fetcher を呼ぶ
   - `apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx` が prop を受領
3. **`server-fetch.ts` 内 fixture（task18_smoke 等）の fall-through 経路**が staging を 404 化させていないか、Phase 5 §2 仮説 #3 と突き合わせ確認。
4. staging で実 URL を `curl -H "x-internal-auth: ***"` し HTTP 200 + Zod parse 成功を確認したログを `outputs/phase-9/staging-curl.log` から引用。

### 4.2 判定

- chain のいずれかが欠落 → `partial_fix = true` → **CRITICAL 差し戻し**（修正対象 Phase を明示）。
- 全て揃い、かつ staging 200 確認済み → `partial_fix = false` → PASS。

### 4.3 出力スキーマ

```yaml
partial_fix_check:
  ticket: FB-CANCEL-004-1
  api_route_registered: true|false
  index_ts_wired: true|false
  shared_zod_exported: true|false
  shared_types_reexported: true|false
  web_fetcher_wired: true|false
  page_tsx_consumes: true|false
  feature_component_consumes: true|false
  fixture_fallthrough_excluded: true|false
  staging_curl_200: true|false
  partial_fix: true|false   # いずれか false なら true
  remediation_phase: <Phase 番号 or null>
```

## 5. MINOR 指摘 → unassigned-task 化方針

### 5.1 原則

- 本 Phase で MINOR を「修正済み」「対応済み」にしない（差し戻しもしない）。
- 全件を `unassigned-tasks[]` 配列に積み、**Phase 12 で formalize**（`docs/30-workflows/_unassigned/` 配下に個別 md として切り出し + `index.md` 追記）。

### 5.2 1 件あたりの記録項目

```yaml
- id: UT-ATTN-<連番>
  title: <60 字以内>
  severity: MINOR
  origin_phase: <検出 Phase>
  category: naming | comment | refactor | a11y-low | perf-micro | doc | other
  files: [<path:line>, ...]
  rationale: <なぜ MINOR か。CRITICAL/MAJOR でない根拠>
  proposed_action: <Phase 12 で formalize 時のアクション仮案>
  blocks_phase_11: false
```

### 5.3 禁止事項

- MINOR を本 Phase で「保留」のまま放置（必ず unassigned-task 化）。
- MINOR を CRITICAL/MAJOR に格上げして差し戻し材料に流用（severity 再判定が必要なら根拠を明記して §3 へ移送）。

## 6. 関連タスク差分確認

### 6.1 FB-CANCEL-004-2 重複チェック

- `FB-CANCEL-004-2` の修正範囲（変更ファイル set）を取得し、本ワークフローの変更ファイル set（§4.1 で抽出）と **共通集合** を出す。
- 共通集合があれば:
  - 同一行への conflict → CRITICAL（Phase 7 へ差し戻し / rebase 指示）
  - 同一ファイル別行 → MINOR（unassigned-task: rebase 確認）

### 6.2 既存 attendance 関連未完タスク

検索:

```bash
grep -RIl --include='index.md' -E '出席|attendance|meeting_session' \
  /Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/ \
  /Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/_unassigned/ 2>/dev/null
```

ヒットしたワークフローについて:

- 本ワークフローが **先取り実装** している項目 → 該当タスクを `superseded_by: admin-attendance-analytics-redesign` 候補として `unassigned-tasks[]` に追加（Phase 12 で正式 close 判定）。
- 本ワークフローが **未カバー** の項目 → MAJOR or MINOR を判定し §3 / §5 に振り分け。

### 6.3 記録フォーマット

```yaml
related_task_diff:
  fb_cancel_004_2:
    overlap_files: [...]
    severity: CRITICAL | MINOR | none
    action: rebase | unassigned-task | none
  attendance_workflows:
    - workflow: <path>
      relation: superseded | partial-overlap | uncovered
      severity: CRITICAL | MAJOR | MINOR | none
      action: close-candidate | unassigned-task | proceed
```

## 7. Phase 11 進行可否判定

### 7.1 判定式

```
phase_11_ready =
  (DoD #1-#5 all PASS)
  AND (§4 正本仕様 all PASS)
  AND (partial_fix == false)
  AND (CRITICAL_count == 0)
  AND (MAJOR_count == 0)
```

`phase_11_ready == true` → `final_review_result = APPROVED` → Phase 11 起動許可。
`phase_11_ready == false` → `final_review_result = BLOCKED` → 差し戻し先 Phase を明示。

### 7.2 出力アクション

| 結果 | 次アクション |
| --- | --- |
| APPROVED | Phase 11 SubAgent 起動。MINOR 一覧は Phase 12 への引継ぎ用に `outputs/phase-10/unassigned-tasks.yaml` を生成 |
| BLOCKED (CRITICAL) | 該当 Phase へ差し戻し。修正完了後 Phase 10 再実行 |
| BLOCKED (MAJOR) | 原則差し戻し。例外的に Phase 11 並行可とする場合は `parallel_fix_justification` を必須記載 |

## 8. 出力

**ファイル**: `outputs/phase-10/final-review-result.md`

**構成**:

```markdown
# Phase 10 Final Review Result

- workflow: admin-attendance-analytics-redesign
- reviewed_at: <ISO8601>
- reviewer: <SubAgent id>
- final_review_result: APPROVED | BLOCKED
- phase_11_ready: true | false

## 1. DoD 評価表
<§2 の表を埋めて貼付>

## 2. §4 正本仕様遵守
<12 項目 PASS/FAIL>

## 3. partial_fix Check (FB-CANCEL-004-1)
<§4.3 YAML>

## 4. Related Task Diff (FB-CANCEL-004-2 ほか)
<§6.3 YAML>

## 5. Severity Summary
- CRITICAL: <count> 件
- MAJOR: <count> 件
- MINOR: <count> 件 → Phase 12 formalize

## 6. Blockers（CRITICAL/MAJOR のみ）
- [id] severity / origin_phase / 概要 / 差し戻し先 Phase / 修正指示

## 7. Unassigned Tasks (MINOR → Phase 12)
<§5.2 配列を YAML として埋め込み。または別ファイル outputs/phase-10/unassigned-tasks.yaml に切り出し参照>

## 8. Next Action
- APPROVED の場合: Phase 11 起動コマンド / 引継ぎ事項
- BLOCKED の場合: 差し戻し先 Phase 番号 / 必須修正リスト / 再実行条件
```

**副生成物**（APPROVED 時のみ）:
- `outputs/phase-10/unassigned-tasks.yaml`（Phase 12 への引継ぎ SSOT）

## 9. 完了条件

1. `outputs/phase-10/final-review-result.md` が §8 の全セクションを埋めて存在する
2. `final_review_result` が APPROVED または BLOCKED のいずれかで確定
3. APPROVED の場合、`unassigned-tasks.yaml` が生成されている（MINOR 0 件でも空配列で生成）
4. BLOCKED の場合、§6 Blockers に最低 1 件記載され、差し戻し先 Phase 番号が明示されている
5. `artifacts.json` に Phase 10 成果物パスが追記されている
