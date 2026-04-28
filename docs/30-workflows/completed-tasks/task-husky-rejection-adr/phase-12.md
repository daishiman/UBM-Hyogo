# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| Phase | 12 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |

## 目的

ADR-0001 を正本ドキュメントとしてリポジトリに追加し、関連する正本（CLAUDE.md / `doc/00-getting-started-manual/lefthook-operations.md` / 派生元 workflow outputs）から ADR-0001 への参照を追記する。Phase 12 標準成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を全て生成する。

## 実行タスク

- ADR-0001 の最終本文（Context / Decision / Consequences / Alternatives Considered / References）が Phase 2 design / Phase 3 review と一致しているかを再確認し、`implementation-guide.md` に ADR 追加箇所と backlink 追記箇所を中学生にも分かる粒度で記述する。
- `system-spec-update-summary.md` に正本ドキュメント側の更新範囲（CLAUDE.md「Git hook の方針」節 / lefthook-operations.md / 派生元 workflow outputs の Phase 2 design ADR-01 / Phase 3 review 第5節）を一覧化する。
- aiworkflow-requirements Phase 12 Step 1 同期（LOGS.md 2件、SKILL.md 変更履歴、topic-map / generate-index、task-workflow 関連表）の実施対象と no-op 判定を `system-spec-update-summary.md` に明記する。
- 新規 interface / API / state / security / UI contract を追加しないため Step 2 domain sync は原則不要とし、不要判断の根拠を `documentation-changelog.md` に残す。
- `documentation-changelog.md` に追加ファイル・更新ファイル・削除ファイル（無し）を Before/After 形式で記録する。
- `unassigned-task-detection.md` に本タスクで派生し得る未割当タスク（例: ADR-002 候補・lefthook 設定の追加方針・ADR テンプレート標準化）を A/B/C 区分で列挙する。発見が無い場合は「該当なし」と明記する。
- `skill-feedback-report.md` に task-specification-creator / aiworkflow-requirements の利用所感・改善要望を記録する。
- `phase12-task-spec-compliance-check.md` に artifacts.json と本仕様書群の整合性チェック結果（outputs 一致 / phase 数 13 / user_approval_required 配置）を記録する。

## 参照資料

- Phase 1〜Phase 11 成果物
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md`
- `lefthook.yml`
- `doc/00-getting-started-manual/lefthook-operations.md`
- `CLAUDE.md`

## 依存成果物

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/main.md`, `outputs/phase-2/design.md`
- Phase 3: `outputs/phase-3/main.md`, `outputs/phase-3/review.md`
- Phase 4: `outputs/phase-4/main.md`, `outputs/phase-4/test-matrix.md`
- Phase 5: `outputs/phase-5/main.md`, `outputs/phase-5/runbook.md`
- Phase 6: `outputs/phase-6/main.md`, `outputs/phase-6/failure-cases.md`
- Phase 7: `outputs/phase-7/main.md`, `outputs/phase-7/coverage.md`
- Phase 8: `outputs/phase-8/main.md`, `outputs/phase-8/before-after.md`
- Phase 9: `outputs/phase-9/main.md`, `outputs/phase-9/quality-gate.md`
- Phase 10: `outputs/phase-10/main.md`, `outputs/phase-10/go-no-go.md`
- Phase 11: `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`

## 実行手順

1. Phase 11 までの成果物・派生元 workflow outputs を読み、ADR-0001 確定版テキストと backlink 追記箇所を再確認する。
2. `implementation-guide.md` に ADR 追加・backlink 追記の手順を中学生レベルの平易な記述で整理する。
3. `system-spec-update-summary.md` / `documentation-changelog.md` を生成し、正本ドキュメントの更新範囲と差分を記録する。
4. Phase 12 Step 1 同期対象を確認し、LOGS.md 2件、SKILL.md 変更履歴、topic-map / generate-index、task-workflow 関連表について「実施 / 対象外 / no-op」と根拠を記録する。
5. Step 2 domain sync の要否を interface / API / state / security / UI contract の変更有無で判定し、不要なら `documentation-changelog.md` に不要理由を記録する。
6. `unassigned-task-detection.md` に派生未割当タスクを A/B/C 区分で列挙、または「該当なし」を明記する。
7. `skill-feedback-report.md` にスキル利用フィードバックを記録する。
8. `phase12-task-spec-compliance-check.md` に artifacts.json 整合性チェック結果を記録する。
9. commit / push / PR 作成は行わず、Phase 13 のユーザー承認待ちを維持する。

## 多角的チェック観点（AIが判断）

- 矛盾なし: ADR-0001 と CLAUDE.md / lefthook-operations.md の記述が衝突しない。
- 漏れなし: Phase 12 標準成果物 7 件が全て生成されている。
- 整合性あり: backlink 追記箇所が Phase 2 設計と Phase 3 設計レビューで決定された位置と一致する。
- 依存関係整合: Phase 11 の docs walkthrough 結果 PASS が Phase 12 ドキュメント更新の前提として満たされている。

## サブタスク管理

| サブタスク | 状態 | 証跡 |
| --- | --- | --- |
| implementation-guide 整備 | completed | outputs/phase-12/implementation-guide.md |
| system-spec-update-summary 整備 | completed | outputs/phase-12/system-spec-update-summary.md |
| Phase 12 Step 1 同期/no-op 判定 | completed | outputs/phase-12/system-spec-update-summary.md |
| Step 2 domain sync 要否判定 | completed | outputs/phase-12/documentation-changelog.md |
| documentation-changelog 整備 | completed | outputs/phase-12/documentation-changelog.md |
| unassigned-task-detection 整備 | completed | outputs/phase-12/unassigned-task-detection.md |
| skill-feedback-report 整備 | completed | outputs/phase-12/skill-feedback-report.md |
| phase12-task-spec-compliance-check 整備 | completed | outputs/phase-12/phase12-task-spec-compliance-check.md |
| 承認前禁止事項確認 | pending_user_approval | Phase 13 user_approval_required |

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

docs-only / NON_VISUAL のため統合テストは Phase 11 の docs walkthrough で代替する。Phase 12 ではドキュメント更新差分が Phase 11 の manual-smoke-log / link-checklist と矛盾しないことを保証する。

## 完了条件

- [ ] Phase 12 標準成果物 7 件が artifacts.json と一致する。
- [ ] Phase 12 Step 1 同期対象（LOGS.md 2件、SKILL.md 変更履歴、topic-map / generate-index、task-workflow 関連表）の実施/no-op 判定が system-spec-update-summary.md に記録されている。
- [ ] Step 2 domain sync の要否判定と不要時の根拠が documentation-changelog.md に記録されている。
- [ ] ADR-0001 と関連正本ドキュメントの参照関係が双方向で確認できる。
- [ ] unassigned-task-detection に派生未割当タスクの所在が記録されている（無ければ「該当なし」明記）。
- [ ] phase12-task-spec-compliance-check で artifacts.json との整合性が PASS している。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

## タスク100%実行確認【必須】

- [ ] 実行タスクを確認した。
- [ ] 参照資料と成果物を照合した。
- [ ] NON_VISUAL 境界を維持した。
- [ ] commit / push / PR 作成を行っていない。

## 次Phase

- Phase 13「完了確認」へ Phase 12 成果物を入力として引き継ぐ。
- Phase 13 はユーザー承認待ちであり、承認なしに commit / push / PR 作成へ進まない。
