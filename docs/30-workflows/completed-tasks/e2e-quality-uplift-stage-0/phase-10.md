# Phase 10: 最終レビュー（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

---

## 1. Acceptance Criteria 達成確認

index.md §Acceptance Criteria サマリの全 AC が、本 PR で生成される仕様書 10 ファイルで論証されているかを確認する。

| AC ID | 内容 | 充足する phase | 結果 |
| --- | --- | --- | --- |
| AC-0b-1 | README に 5 項目（un-skip / coverageTier / pnpm e2e / smoke list / auth fixture）の章がある | phase-2 §3 + phase-4 RG-2/3/4/5/6 | OK |
| AC-0b-2 | `mise exec --` 経由 1 行コマンドが README にある | phase-2 §3 + phase-4 RG-4 | OK |
| AC-0c-1 | quality-gates.md §7.1 (4) 例外条項追記文面確定 | phase-2 §4 + phase-5 §3-A | OK |
| AC-0c-2 | `profile-{visibility,delete}-request.spec.ts:2` stale comment 削除仕様 | phase-1 inventory + phase-2 §4 + phase-8 §3 | OK |
| AC-0c-3 | `evidence-capture` project の責務境界が phase-2 design topology で明確化 | phase-2 §1 / §4 | OK |

全 5 AC clear。

---

## 2. blocker 検出

| 種別 | 候補 | 状態 |
| --- | --- | --- |
| 技術的 blocker | なし（implementation） | clear |
| 依存 blocker | PR #594 が `dev` merged（前提） | clear |
| 政治的 / governance blocker | solo dev、CODEOWNERS 影響なし | clear |
| skill spec drift | quality-gates.md は本サイクルで touch 済み（本サイクル）。本 PR 内では drift 発生せず | clear |
| 本サイクル依存 | Stage 1 が AC-0c-1 に依存するが、Stage 0 仕様確定で十分（実コード edit は本サイクル） | acceptable |

**blocker 0 件**。

---

## 3. 残課題（本サイクルへの引き継ぎ）

| ID | 内容 | 担当 phase（本サイクル） |
| --- | --- | --- |
| H-1 | `apps/web/playwright/README.md` 新規作成（Phase 2 §3 章構成に従う） | 本サイクル Phase 5 |
| H-2 | `apps/web/playwright.config.ts` `projects[]` に `evidence-capture` 追加 | 本サイクル Phase 5 |
| H-3 | `profile-readonly.spec.ts` rename/extract（R1 案 A）+ `profile-readonly-logged-in.spec.ts` 新規 | 本サイクル Phase 5 |
| H-4 | `profile-{visibility,delete}-request.spec.ts:2` stale comment 削除 | 本サイクル Phase 5 |
| H-5 | quality-gates.md §7.1 (4) 例外条項 8 行追記 | 本サイクル Phase 5（skill mirror sync 同時実施） |
| H-6 | `apps/web/package.json` `e2e` script に `--project=...` 明示 | 本サイクル Phase 5 |

---

## 4. 最終 verdict

| 項目 | 結果 |
| --- | --- |
| Stage 0b 仕様書品質 | GO |
| Stage 0c 仕様書品質 | GO |
| AC 達成 | 5/5 |
| blocker | 0 |
| Phase 11 進行可否 | 可 |

---

## 5. 確認サインオフ（仕様書）

- Phase 2 設計と Phase 8 Before/After に矛盾なし
- Phase 4 R1 案 A 確定が Phase 5 §3-C / Phase 8 §3 に反映済
- Phase 6 FP-1〜FP-7 が Phase 4 RG-1〜RG-10 と相互補完（grep gate と fail path の対応）

→ Phase 11 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 10
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
