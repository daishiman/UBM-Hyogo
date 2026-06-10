# Phase 12: ドキュメント同期

[実装区分: 実装仕様書]

> 本タスクは `implemented_local_evidence_captured`。apps/web 実装・focused Vitest・local Playwright screenshot・typecheck・design-token gate・aiworkflow / system spec 同期まで完了し、staging screenshot と commit / push / PR のみ user-gated とする。

---

## 0. 前提

| 項目 | 値 |
|------|-----|
| slug | `admin-schema-history-purpose-clarity-and-filter-fix` |
| workflow_state | `implemented_local_evidence_captured` |
| visual_category | `VISUAL` |

---

## Task 索引

| Task | 名称 | 内容 | 成果物 |
|------|------|------|--------|
| 12-1 | サマリー | Phase 12 完了範囲・local evidence・user-gated 境界 | `outputs/phase-12/main.md` |
| 12-2 | 実装ガイド | Part 1（やさしい説明）+ Part 2（技術者向け）。SSOT §5/§6/§11 を反映 | `outputs/phase-12/implementation-guide.md` |
| 12-3 | system spec 更新判定 | Step 1-A/1-B/1-C/Step 2 判定。aiworkflow-requirements への昇格要否 | `outputs/phase-12/system-spec-update-summary.md` |
| 12-4 | ドキュメント変更ログ | 全 Step の結果（該当なしも記録）。workflow-local / global skill を分離 | `outputs/phase-12/documentation-changelog.md` |
| 12-5 | 未タスク検出 | Phase 3 MINOR M-1 / M-2 を current / baseline 分離で記録 | `outputs/phase-12/unassigned-task-detection.md` |
| 12-6 | skill フィードバック | テンプレート/ワークフロー/ドキュメント観点の改善点 | `outputs/phase-12/skill-feedback-report.md` |
| 12-7 | コンプライアンスチェック | canonical 9 セクション。CI gate `verify:phase12-compliance` 正本 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## outputs 7 成果物（strict 7）

| File | 役割 |
|------|------|
| `outputs/phase-12/main.md` | Phase 12 サマリー |
| `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル）+ Part 2（技術者レベル） |
| `outputs/phase-12/system-spec-update-summary.md` | system spec 更新判定（N/A 根拠付き） |
| `outputs/phase-12/documentation-changelog.md` | 全 Step 結果の個別明記 |
| `outputs/phase-12/unassigned-task-detection.md` | M-1 / M-2 current/baseline 分離 |
| `outputs/phase-12/skill-feedback-report.md` | skill 改善点 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 セクション compliance |

---

## Phase 11 evidence（local evidence captured）

- `outputs/phase-11/manual-test-result.md`（status `local_evidence_captured_staging_pending`）
- focused Vitest / local Playwright screenshot 2 PNG / typecheck / design-token gate / apps/api diff empty を local evidence として記録済み。
- staging screenshot 2 件は user-gated。

---

## user-gated 境界

- commit / push / PR 作成（Phase 13）
- staging deploy + 認証越し screenshot 取得（Phase 11）
