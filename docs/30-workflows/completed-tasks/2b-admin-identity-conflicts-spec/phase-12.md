# Phase 12 — Close-out compliance（7 outputs）

> 本 phase は `runtime_pending` close-out として実行済み。実コード生成 + local chromium runtime evidence は取得済みで、firefox / webkit / staging / commit / push / PR は後続 user gate。

## 1. Phase 12 必須 7 outputs（実体存在チェック）

| # | path | 内容 |
|---|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 主成果物（close-out summary） |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装ガイド（Part 1 中学生レベル + Part 2 技術者レベル） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | システム仕様書更新サマリ（更新無しなら「更新なし」と明記） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | スキルフィードバック（改善なしでも 3 観点固定で出力） |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力必須） |
| 7 | `outputs/phase-12/documentation-changelog.md` | ドキュメント更新履歴 |

> 7 ファイルのうち 1 件でも欠けたら Phase 12 FAIL。

本 workflow では `outputs/phase-12/` 配下に上記 7 ファイルを作成済み。root `artifacts.json` が唯一の artifacts 正本で、`outputs/artifacts.json` は作成しない。

## 2. compliance check 項目

| # | 観点 | 検証コマンド | 期待 |
|---|------|-------------|------|
| 1 | spec ファイル存在 | `test -f apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 1 件 |
| 2 | 6 test PASS | `outputs/phase-11/evidence/e2e-run.log` 内 `6 passed` | 含む |
| 3 | typecheck PASS | exit 0 | OK |
| 4 | lint PASS | exit 0 | OK |
| 5 | 3 ロール共存 | `grep -c "adminPage\|memberPage\|anonymousPage" "$SPEC"` | ≥ 3 |
| 6 | mock のみ（実 endpoint 直叩きなし） | `grep -nE "fetch\(\|http://" $SPEC` | 0 hit |
| 7 | merge response shape OK | mock handler `parse()` 例外なし | OK |
| 8 | `mergedMemberId` 不出現 | `grep -n "mergedMemberId" $SPEC` | 0 hit |
| 9 | skip 0 件 | `grep -nE "test\.skip\|test\.fixme" $SPEC` | 0 hit |
| 10 | 行数 200-240 | `wc -l $SPEC` | 範囲内 |
| 11 | docs-only / dirty-code gate | `git status apps/ packages/` で本 spec 以外の dirty diff なし | OK |
| 12 | OKLch 不変条件 | `grep -nE "bg-\[#\|text-\[#" $SPEC` | 0 hit |

## 3. workflow_state 遷移

- 実コード生成 + ローカル PASS 5 点: `runtime_pending`（詳細サブカテゴリ: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`）
- CI runtime PASS 確認後: `completed`

## 4. dirty-code gate

`apps/` / `packages/` の dirty diff が本 spec 以外に存在する場合、分類・分離記録なしに PASS させない（CONST_007 整合）。

## 5. system spec 更新

本 spec の追加で `CLAUDE.md` / `docs/00-getting-started-manual/` の正本仕様変更は **発生しない**。ただし Playwright evidence routing、server-side fixture gate、shared schema strict 化は実コード・正本台帳へ同一 wave で反映する。

ただし aiworkflow-requirements の索引・台帳は同一 wave で更新する。対象は quick-reference、resource-map、task-workflow-active、artifact inventory、SKILL changelog、LOGS。
