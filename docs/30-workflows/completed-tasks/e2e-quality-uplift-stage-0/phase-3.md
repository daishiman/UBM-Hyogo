# Phase 3: 設計レビュー（Stage 0）

date (absolute): 2026-05-08

4 条件ゲート: **価値性 / 実現性 / 整合性 / 運用性** をサブタスクごとに判定する。

---

## Stage 0b — Playwright README

| 観点 | 評価 | 根拠 | 判定 |
| --- | --- | --- | --- |
| 価値性 | 新規参加者 / Claude Code が `pnpm e2e` 起動・coverage 仕様・un-skip ルール・auth fixture を 1 ファイルで把握できる導線が今は存在しない。skill spec は `.claude/skills/` 配下で発見性が低く、apps/web 単位の README は実利が高い | quality-gates.md §7.1 / §7.5 の運用 onboarding コストを下げる | GO |
| 実現性 | 200 行以内の implementation。既存の `apps/web/playwright/{tests,fixtures,page-objects}` 構造をそのまま記述するのみで新規 fact は発生しない | inventory が既存ファイル列挙のみ | GO |
| 整合性 | §7.5 tier table を再掲ではなく link で参照する設計。skill spec とのドリフト risk を R2 で緩和済 | phase-2 §6 validation paths が grep ベース | GO |
| 運用性 | implementation のため CI gate 追加不要。L1 docs-grep で Phase 11 evidence 取得可能 | `phase-11-non-visual-alternative-evidence.md` L1 相当 | GO |

**verdict**: **GO** — Phase 4 へ進める。

---

## Stage 0c — profile-readonly skip cleanup + stale comment 除去

| 観点 | 評価 | 根拠 | 判定 |
| --- | --- | --- | --- |
| 価値性 | §7.1 (4) 不変条件と現 spec 実態の矛盾を解消。stale comment 除去で「`describe.skip` 復活待ち」の誤解を防ぐ | PR #594 後の inconsistency を直接是正 | GO |
| 実現性 | (a) skill spec への 8 行追記、(b) Playwright config に project entry 1 件追加、(c) stale comment 2 行削除、(d) README 章 1 つ追加。すべて mechanical edit | phase-2 §4 の文面が確定済 | GO（条件付き） |
| 整合性 | CONST_007 と整合（skip を「先送り」ではなく「正規化」）。tier-aware §7.5 とも矛盾しない（evidence-capture は coverage 対象外と明記） | phase-2 §4 例外文面 c. | GO |
| 運用性 | `pnpm e2e` 標準実行は project filter 明示で副作用なし。`evidence-capture` は env opt-in で誤起動しない | phase-2 §4 起動条件 | GO |

**条件付き GO の条件（R1 残課題）**: 旧 `profile-readonly.spec.ts` の evidence 専用性がファイル名から分からない問題は Phase 4 計画で確定する。3 案を残す:

| 案 | 概要 | 採否は Phase 4 |
| --- | --- | --- |
| A | evidence-only spec を `profile-readonly-logged-in.spec.ts` へ rename/extract し、旧 `profile-readonly.spec.ts` を削除 | 推奨 |
| B | `testMatch` ではなく `grep` (tag) で project を絞る（`@evidence-capture` tag を describe 名に付与） | 代替 |
| C | 現状維持（旧ファイル名のまま `testMatch` に使う） | 非推奨（責務が読めず標準 suite と混同する） |

**verdict**: **GO** — Phase 4 へ進める（R1 を Phase 4 冒頭で決着させる前提）。

---

## 全体 verdict

| 項目 | 結果 |
| --- | --- |
| Stage 0b GO/NO-GO | **GO** |
| Stage 0c GO/NO-GO | **GO（R1 を Phase 4 で確定）** |
| Phase 4 着手可否 | **可（本サイクルで `task-specification-creator` を再起動して Phase 4 から再開）** |
| open question | R1: profile-readonly evidence spec の rename/extract 方針（A/B/C） |
| escalation 対象 | なし（solo dev、user 判断のみで R1 解決可能） |

---

## 本サイクルでの引き継ぎ事項

1. Phase 4 冒頭で R1 の A/B/C を 1 つに確定する（推奨: A）。
2. 実 edit 対象は 5 箇所:
   - `apps/web/playwright/README.md`（new）
   - `apps/web/playwright.config.ts`（projects[] に evidence-capture 追加 + `pnpm e2e` script の project filter 明示）
   - `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`（rename/extract or tag。R1 確定後）
   - `apps/web/playwright/tests/profile-visibility-request.spec.ts:2`（comment 削除）
   - `apps/web/playwright/tests/profile-delete-request.spec.ts:2`（comment 削除）
   - `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 (4)（例外条項追記）
3. Phase 11 evidence は L1 docs-grep + L2 lint-boundary で構成。E2E full run は本ステージの責務外（Stage 1 以降）。
4. PR base は `dev`。本サイクルは仕様書と必要な実コード edit を同一 PR で扱う。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 3
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
