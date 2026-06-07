# 出席分析の計算意味論是正タスク仕様書（issue #1101）

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 §0 参照）
- taskType: `implementation` / visualEvidence: `VISUAL`（label/KPI タイル変更のみ。staging 視覚証跡は user-gated）/ implementation_mode: `new`
- workflow_state: `implemented_local_evidence_captured`（実コード・focused tests・正本仕様同期まで完了。staging visual / commit / push / PR は user-gated）
- source: GitHub issue **#1101**（CLOSED のまま。ユーザー指示によりクローズド維持で仕様書化）
- 親 workflow: `docs/30-workflows/admin-attendance-dashboard-ux/`（UI/UX 是正は完了済み・#1108 merged）
- スコープ: `apps/api`（出席分析 repository）/ `packages/shared`（zod schema）/ `apps/web`（admin 出席ダッシュボードの label・KPI）/ `docs`（API schema）/ test。**D1 migration・endpoint path/method・Google Form schema は非変更**（不変条件 #1 #5）

## 背景（調査結論）

issue #1101 は親タスク `admin-attendance-dashboard-ux`（#1108 merged）の Phase 12 で検出された
「UI 見た目崩れとは別の **計算意味論の残課題**」を formalize したもの。
**2026-06-05 時点のコード調査で、本 issue の問題は未解決であることを確定した**:

| 検証対象 | 現状コード | 問題 |
| --- | --- | --- |
| `apps/api/src/repository/attendance-analytics.ts` `zoneFromCount` | `count > 99 → "unknown"` | **100 回以上の正常値が「分類不能(unknown)」に落ちる** |
| `apps/api/.../attendance-analytics-internals.spec.ts` | `expect(zoneFromCount(100)).toBe("unknown")` | バグを正として固定したテストが現存 |
| `packages/shared/.../admin-attendance.ts` `AttendanceZoneZ` | `z.enum(["0→1","1→10","10→100","unknown"])` | 旧矢印 enum のまま・100+ 帯が無い |
| `apps/web/.../format-attendance.ts` `ZONE_LABEL.unknown` | `"100 回以上"` | **UI 側だけの暫定補正。API enum は依然 unknown 扱い → 静かな乖離** |
| `apps/api/.../computeAttendanceOverviewExt` `overallRate` | `attendCount / (totalSessions * totalMembers)` | 延べ/unique の定義が曖昧・unique 指標が無い |
| `docs/00-getting-started-manual/specs/01-api-schema.md` Zone 派生 | `>=100 → 'unknown'` と明記 | バグが仕様 doc にも転写されている |

→ **別タスクでの修正は存在しない**（`git log` 上、親 #1108 以降に attendance-analytics.ts / shared schema の修正なし）。本タスクは必要。

## 根本原因（確定）

1. **境界バグ**: `zoneFromCount` の最終 else が正常な高頻度帯（100+）を `"unknown"` に分類している。`"unknown"` 本来の責務（負値・NaN 等の分類不能フォールバック）と混在。
2. **enum 表記**: `AttendanceZone` が表示用矢印文字列（`"0→1"`）を機械可読キーとして兼用しており、API 内部分類・shared schema・web ラベル・filter 入力が同一文字列に密結合。1 ファイルだけ直すと UI と API が静かに乖離する。
3. **rate 定義の曖昧さ**: `overallRate`（延べ率）が UI 文言「期間内出席者数」と混同されやすく、unique 出席者という別概念が未整理。

## スコープ（本サイクル完結＝AC-1..AC-8・単一 PR）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| zone 境界・命名是正 | `AttendanceZone` を機械可読キー `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown` へ再設計。`zoneFromCount` を 100+ 正常分類へ修正、`normalizeZone` に旧矢印値の互換マッピング追加 | `attendance-analytics.ts` / `admin-attendance.ts` |
| unique 指標追加 | `AttendanceOverviewExt` に `uniqueAttendeeCount` / `uniqueAttendanceRate` を additive field 追加。`overallRate` を延べ率と定義明確化。base `viewmodel.ts` は非変更 | `attendance-analytics.ts` / `admin-attendance.ts` |
| web label / KPI 追従 | `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` を新キーへ更新。`KpiPanel` に unique KPI タイル追加 | `format-attendance.ts` / `KpiPanel.tsx` |
| doc 更新 | Zone 派生・集計母数・overview response shape を新仕様へ更新 | `01-api-schema.md` |
| test | 境界値・normalize・overview rate / unique・UI ラベル追従の focused test を更新/追加 | `__tests__/*.spec.ts(x)` |

## スコープ外（明示）

- **UBM 事業成長フェーズ zone（別ドメイン・絶対非変更）**: `apps/api/src/routes/admin/_shared/byZone.ts`（`0to1`/`1to10`/`10to100`）、`apps/web/src/components/public/AboutUbm.tsx` / `MemberFilters.client.tsx` / `SelectedFiltersBar.client.tsx`（`0_to_1`/`1_to_10`/`10_to_100`）。これらは「会員企業の成長段階」を表す**出席回数帯とは無関係な別概念**で、視覚ラベルが偶然 `0→1` 等と一致するだけ。`AttendanceZone` 型を import していない。本タスクで触れない（Phase 1 §3・Phase 9 で grep gate）。
- 親タスクで完了済みの CSS レイアウト復旧・SVG バー楕円修正・見方ガイド UI 再設計。
- D1 schema migration / endpoint path / HTTP method / Google Form schema の変更。
- staging deploy・commit・push・PR（Phase 13 = user-gated）。

## Acceptance Criteria

Phase 1 の AC-1..AC-8 を正本とする（要約）:
- AC-1: `zoneFromCount(100)` 以上が `unknown` に落ちず `zone_100_plus` に分類される。
- AC-2: 旧矢印 enum 値（`"0→1"` 等）が API enum / shared schema / web から消え、filter 互換入力としてのみ `normalizeZone` で吸収され、明示テストがある。
- AC-3: `overallRate`（延べ率）/ `uniqueAttendeeCount` / `uniqueAttendanceRate` の分母・分子・役割がコード・schema・doc・UI ラベルで一致。
- AC-4: `AttendanceZoneZ` と `zoneFromCount` の返り値集合が一致。
- AC-5: `ZONE_LABEL` / `SELECTABLE_ZONES` が新境界に追従し、`unknown` は「分類不能」表記。
- AC-6: `KpiPanel` が unique KPI タイルを表示し additive field を consume している。
- AC-7: focused vitest / typecheck / lint が PASS。
- AC-8: D1 migration / endpoint path / method / Google Form schema の差分ゼロ。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義（実装区分判定・AC・inventory・命名規則） | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（enum 再設計・rate 定義・SQL・4 面一致マップ） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー（Phase 4 進行可否判定） | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画（RED 仕様） | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順（変更ファイル別差分方針） | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加（fail path・回帰 guard） | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ確認 | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタリング | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA（grep gate・4 面一致確認） | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / 証跡 | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release（user-gated） | [phase-13-pr.md](phase-13-pr.md) |

## 検証コマンド（本サイクルの DoD）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
git diff --name-only -- apps/api/migrations apps/api/src/routes   # 差分ゼロ期待
rg -n '"0→1"|"1→10"|"10→100"' apps/api/src apps/web/src/features/admin/attendance packages/shared  # AttendanceZone 由来の残存ゼロ期待
```
