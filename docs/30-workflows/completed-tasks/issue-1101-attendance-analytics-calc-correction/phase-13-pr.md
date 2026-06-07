# Phase 13: commit / PR / release（user-gated）

> **本 Phase は user の明示承認後のみ実施する（CONST_002）**。Claude Code は `git add` / `git commit` / `git push` / `gh pr create` / staging deploy / screenshot 取得を自律的に実行しない。

## メタ情報

- task_id: `issue-1101-attendance-analytics-calc-correction`
- workflow_state: `implemented_local_evidence_captured` → Phase 13 は `pending_user_approval`
- source: GitHub issue **#1101**（CLOSED のまま維持。本 PR は「クローズド issue の根本解決」として作成し、issue の状態は変更しない）
- PR base: **`dev`**（既定。production リリース時の `dev → main` のみ別途）
- 本 Phase の状態: **BLOCKED（pending_user_approval）**

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ計算意味論是正を統合する。
本 Phase は **user 明示承認後にのみ実行**する。

## ブロック理由

本 workflow は `spec_created` であり、実装（apps/api / packages/shared / apps/web / doc / test）は未着手。
以下の条件がすべて揃うまで Phase 13 の実行を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-7 実装完了（API repository / shared schema / web label・KPI / doc / test） | pending（実装サイクル） |
| focused vitest が green（internals / repository / format / KpiPanel） | pending |
| `pnpm typecheck && pnpm lint` が green | pending |
| `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空（AC-8） | pending |
| grep gate（旧矢印 enum 残存ゼロ / 別ドメイン非変更） | pending |
| Phase 12 必須 6 成果物の実体確認 | pending（実装サイクルで作成） |
| staging real D1 視覚確認（unique 指標・`zone_100_plus` 帯） | pending（user-gated） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated |
| `git push origin fix/issue-1101-attendance-analytics-calc-correction` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging deploy（`apps/api` / `apps/web`） | user-gated |
| staging real D1 視覚確認・pixel screenshot 取得 | user-gated |

## 実行順序（承認後）

### 1. ローカル品質確認（DoD・全 green を確認してから commit）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. \
  apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts \
  apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts \
  apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx
git diff --name-only -- apps/api/migrations apps/api/src/routes   # 空であること（AC-8）
rg -n '"0→1"|"1→10"|"10→100"' apps/api/src apps/web/src/features/admin/attendance packages/shared  # 残存ゼロ期待
```

### 2. コミット粒度（4 単位）

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/phase-*.md` / `index.md` |
| 2 | impl-api/shared（計算意味論是正） | `apps/api/src/repository/attendance-analytics.ts` / `packages/shared/src/zod/admin-attendance.ts` / `apps/api/.../__tests__/attendance-analytics-internals.spec.ts` / `attendance-analytics.repository.spec.ts` |
| 3 | impl-web（label / KPI 追従） | `apps/web/.../lib/format-attendance.ts` / `apps/web/.../components/KpiPanel.tsx` / `apps/web/.../__tests__/format-attendance.spec.ts` / `KpiPanel.spec.tsx` |
| 4 | docs/outputs（doc 同期 + Phase 12） | `docs/00-getting-started-manual/specs/01-api-schema.md` / `outputs/phase-12/*.md` / `artifacts.json` |

### 3. PR 作成

```bash
gh pr create \
  --base dev \
  --title "fix(admin): 出席分析の計算意味論を是正（zone境界バグ・enum機械可読化・unique指標追加）" \
  --body "$(cat <<'EOF'
## Summary

クローズド issue **#1101** の根本解決（issue 状態は CLOSED のまま維持）。
出席分析の計算意味論を是正し、API / shared schema / web label・KPI / doc / test の 4 面を同一変更セットで同期する。

- `zoneFromCount` の境界バグを修正: `n >= 100` が `zone_100_plus` を返し、`unknown`（分類不能）に落ちなくなる（AC-1）
- `AttendanceZoneZ` を表示用矢印文字列から **snake_case 機械可読キー**（`zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` / `unknown`）へ再設計。旧矢印値は `normalizeZone` の互換マッピングで吸収し明示テスト追加（AC-2 / AC-4）
- `AttendanceOverviewExt` に `uniqueAttendeeCount` / `uniqueAttendanceRate` を additive 追加（`.strict()` 維持）。`overallRate` を延べ率として定義明確化（AC-3）
- web `ZONE_LABEL` / `SELECTABLE_ZONES` / `ZONE_HELP` を新境界へ追従（`zone_100_plus`=「100 回以上」/ `unknown`=「分類不能」）（AC-5）
- `KpiPanel` に unique KPI タイル（`data-testid="attendance-kpi-unique"`）を追加し additive field を consume（AC-6）
- `01-api-schema.md` の Zone 派生・集計母数・overview response shape を新仕様へ更新
- `apps/api/migrations` / `apps/api/src/routes` 無変更（D1 migration / endpoint path / method / Google Form schema 不変・AC-8）

## 背景（クローズド issue の根本解決）

issue #1101 は親タスク `admin-attendance-dashboard-ux`（#1108 merged）の Phase 12 で検出された
「UI 見た目崩れとは別の計算意味論の残課題」を formalize したもの。2026-06-05 のコード調査で未解決を確定。
旧コードは `count > 99 → "unknown"` で 100 回以上の正常値を「分類不能」に分類し、その誤分類が test・shared enum・doc にも転写されていた。本 PR で 4 面を同時是正する。

## 変更ファイル

- `apps/api/src/repository/attendance-analytics.ts`（zoneFromCount 境界 / normalizeZone 互換 / unique 集計 SQL + bind 順序）
- `packages/shared/src/zod/admin-attendance.ts`（AttendanceZoneZ 再設計 / Ext に unique 2 field）
- `apps/api/src/repository/__tests__/attendance-analytics-internals.spec.ts`
- `apps/api/src/repository/__tests__/attendance-analytics.repository.spec.ts`
- `apps/web/src/features/admin/attendance/lib/format-attendance.ts`
- `apps/web/src/features/admin/attendance/components/KpiPanel.tsx`
- `apps/web/src/features/admin/attendance/__tests__/format-attendance.spec.ts`
- `apps/web/src/features/admin/attendance/__tests__/KpiPanel.spec.tsx`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 検証

- focused vitest（internals / repository / format / KpiPanel）PASS
- `pnpm typecheck` / `pnpm lint` PASS
- `git diff --name-only -- apps/api/migrations apps/api/src/routes` が空（AC-8）
- `rg '"0→1"|"1→10"|"10→100"'` で AttendanceZone 由来の旧矢印残存ゼロ
- 別ドメイン zone（UBM 事業成長フェーズ: byZone.ts / AboutUbm.tsx 等）は非変更

## スクリーンショット

staging real D1 環境での視覚確認（unique KPI タイル・`zone_100_plus` 帯）は **user-gated**。
取得後に `outputs/phase-11/screenshots/` に追記し PR に参照を含める。

## 参照

- task_id: `issue-1101-attendance-analytics-calc-correction`
- 実装仕様: `docs/30-workflows/completed-tasks/issue-1101-attendance-analytics-calc-correction/`
- source issue: #1101（CLOSED のまま維持）
EOF
)"
```

## staging 検証（承認後・user-gated）

PR マージ前後の staging real D1 検証観点:

1. `/(admin)/admin/dashboard/attendance` の overview で `uniqueAttendeeCount` / `uniqueAttendanceRate` が延べ率（`overallRate`）と区別された値で読めること。
2. zone-distribution に 100 回以上の会員が `zone_100_plus`（「100 回以上」）帯として独立表示され、「分類不能」に落ちていないこと。
3. unique KPI タイルが既存 4 タイルと同列で破綻なく表示されること。

## DoD（本サイクルの完了定義）

- `mise exec -- pnpm typecheck` green
- `mise exec -- pnpm lint` green
- focused vitest 4 spec PASS
- `git diff --name-only -- apps/api/migrations apps/api/src/routes` 空（AC-8）
- grep gate（旧矢印残存ゼロ / 別ドメイン非変更）PASS
- PR CI（typecheck / lint / verify-test-suffix / 該当 gate）green
- `gh pr create --base dev` 成功・PR URL 取得

## 完了条件

1. 本 Phase が `pending_user_approval` として明記され、commit/push/PR/staging が user-gated であることが冒頭に記載されていること。
2. PR base = `dev`、issue #1101 を CLOSED のまま維持し「クローズド issue の根本解決」と明記されていること。
3. コミット粒度（4 単位）と PR 本文構成案（AC マッピング・変更ファイル・検証・staging user-gated）が確定していること。
4. DoD（typecheck / lint / focused vitest / AC-8 / grep gate）が定義されていること。
5. staging real D1 検証（uniqueAttendeeCount/Rate・`zone_100_plus`）が user-gated として明記されていること。

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| 要件（AC 正本） | `phase-1-requirements.md` |
| 設計（正本） | `phase-2-design.md` |
| artifacts | `artifacts.json` |
