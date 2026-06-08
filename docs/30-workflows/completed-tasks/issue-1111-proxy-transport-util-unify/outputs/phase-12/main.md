# Phase 12 — Implementation Guide / Close-out（issue-1111-proxy-transport-util-unify）

Phase 12 は本ワークフローの strict 7 成果物を集約し、close-out 状態を確定する。

## メタ概要

| Key | Value |
| --- | --- |
| workflow_id | `issue-1111-proxy-transport-util-unify` |
| taskType | `refactoring`（pure refactor） |
| visualEvidence | `NON_VISUAL`（transport 選択ロジックの内部抽出・UI/UX 変更なし） |
| implementation_mode | `new`（共通 util `transport-select.ts` を新規作成し 3 呼び出し側を import 切替） |
| workflow_state | `implemented_local_evidence_captured`（実装済み・ローカル証跡取得済み。commit/PR は user 明示承認後） |
| source_issue | [#1111](https://github.com/daishiman/UBM-Hyogo/issues/1111)（`CLOSED`・closed のまま spec 作成） |
| PR base | `dev` |

## 目的（1 行）

「binding 優先 → HTTP fallback」transport 選択イディオムが 3 ファイル（`route.ts` / `server-fetch.ts` / `public.ts`）に独立複製されている drift 源を、新規 pure util `apps/web/src/lib/fetch/transport-select.ts` に集約する。

## Phase 12 strict 7 成果物リスト

| # | 成果物 | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | 本ファイル。Phase 12 概要・close-out サマリ |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（概念）/ Part 2（技術詳細・型シグネチャ・差替コード） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A/1-B/1-C・Step 2 の system spec 反映状況 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step の結果記録・workflow-local / global skill sync 別ブロック |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（current 0 件 / baseline 分離・auth.ts スコープ外判定） |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレート/ワークフロー/ドキュメント改善観点 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 見出し準拠チェック（CI gate `verify:phase12-compliance`） |

## close-out サマリ

| 項目 | 状態 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（index.md / artifacts.json / outputs/artifacts.json 一致） |
| apps/ 変更 | **あり**。`transport-select.ts` 新規 + 3 呼び出し側切替 + util spec 追加 |
| Phase 1-12 | completed |
| Phase 13（PR 作成） | `pending_user_approval`（commit / push / PR は user-gated） |
| YAGNI gate | 解除済（3 箇所目の同型コピー = `public.ts` 出現で Rule of Three 成立） |
| スコープ外 | `auth.ts`（軽量変種・同型 transport 選択ではない別形状ゆえ統合しない） |
| 未タスク検出 | current 0 件（§unassigned-task-detection.md） |
| 視覚証跡 | NON_VISUAL のため Phase 11 スクリーンショット不要。代替証跡 = phase-10-final-review.md / phase-11-manual-test.md |

## 作成・編集済みファイル

| 区分 | パス |
| --- | --- |
| 新規 util | `apps/web/src/lib/fetch/transport-select.ts` |
| 新規 util spec | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` |
| 切替 1（admin mutation） | `apps/web/app/api/admin/[...path]/route.ts` |
| 切替 2（admin read） | `apps/web/src/lib/admin/server-fetch.ts` |
| 切替 3（public read） | `apps/web/src/lib/fetch/public.ts` |
| 既存回帰 spec（緑維持） | `route.spec.ts` / `server-fetch.binding.spec.ts` / `server-fetch.http-fallback.spec.ts` / `server-fetch.env.spec.ts` / `public.spec.ts` |

## 検証コマンド（実行済み）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/fetch/public.spec.ts
mise exec -- pnpm verify:phase12-compliance
```

結果: focused Vitest 6 files / 44 tests PASS、web typecheck PASS、web lint PASS、Phase 12 compliance PASS。
