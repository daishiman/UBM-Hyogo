# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成（approval-gated） |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (ドキュメント・未タスク検出・スキルフィードバック) |
| 次 Phase | なし（最終） |
| 状態 | pending |
| user_approval_required | **true** |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state（PR 完了時） | `enforced_dry_run`（warning-mode 実装ドラフト、strict enforcement は別 wave） |

## 目的

local check → commit → push → `gh pr create` の最終ゲートを通し、issue #192 に対応する **タスク仕様書 PR** を作成する。
**ユーザーの明示的な承認なく commit / push / PR 作成を行ってはならない。**

issue #192 は既に **CLOSED** 維持のため、PR body / commit message には `Closes #192` を **使わず** `Refs #192` のみ採用する。

## 三役ゲート（user 承認 / 実 push / PR 作成）

| # | ゲート | 通過条件 | Claude が実行可か |
| --- | --- | --- | --- |
| 1 | user 承認ゲート | `outputs/phase-13/change-summary.md` を提示し、user の **明示文言**（「PR 作成して」等）で承認取得 | 承認取得まで実行禁止 |
| 2 | 実 push ゲート | ゲート 1 PASS 後、コミット粒度ごとに commit → feature ブランチ push | ゲート 1 後にのみ実行 |
| 3 | PR 作成ゲート | ゲート 2 PASS 後、`gh pr create` で PR 発行、PR URL を `outputs/phase-13/pr-info.md` に記録 | ゲート 2 後にのみ実行 |

> 曖昧な合意（「いいよ」程度）では実行しない。`change-summary.md` を提示した上での明示指示を要件とする。

## 必須成果物 4 点

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | **必須**: typecheck / lint / link-checklist / secret hygiene grep の PASS ログ |
| `outputs/phase-13/change-summary.md` | 変更サマリー（PR 作成前にユーザーに提示） |
| `outputs/phase-13/pr-info.md` | PR 作成後の URL / CI 結果 |
| `outputs/phase-13/pr-creation-result.md` | PR 作成プロセスの実行ログ |

## local-check-result.md（必須記録コマンド）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# evidence secret hygiene 再 grep
grep -iE '(token|cookie|authorization|bearer|set-cookie)' \
  docs/30-workflows/03a-stablekey-literal-lint-enforcement/outputs/phase-11/evidence/*.txt \
  || echo 'PASS (0 hit)'

# artifacts.json parity
jq '.metadata.workflow_state' \
  docs/30-workflows/03a-stablekey-literal-lint-enforcement/artifacts.json
# 期待: "enforced_dry_run"

# 7 ファイル実体確認
ls -1 docs/30-workflows/03a-stablekey-literal-lint-enforcement/outputs/phase-12/ | wc -l
# 期待: 7
```

すべて PASS を `outputs/phase-13/local-check-result.md` に記録。

## change-summary.md（user 提示用）

- 新規ディレクトリ: `docs/30-workflows/03a-stablekey-literal-lint-enforcement/`
  - `index.md` / `artifacts.json` / `phase-01.md`〜`phase-13.md`
  - `outputs/phase-01〜13/` 各種設計成果物（仕様書のみ、コード実装なし）
- 既存 legacy stub の更新: `docs/30-workflows/completed-tasks/task-03a-stablekey-literal-lint-001.md` に `## Canonical Status` 追記
- aiworkflow-requirements skill: 不変条件 #1 補強記述、`legacy-ordinal-family-register.md` mapping 追加
- 03a workflow `outputs/phase-12/implementation-guide.md` AC-7 表記更新は **本 PR では実施しない**（後続 implementation wave + 段階 ③ 適用 wave で同時実施を予約）

## コミット粒度（論理単位）

`spec / config / impl / test / docs` の 5 単位読み替え。本タスクは仕様書作成のみのため以下の論理粒度で分離:

| # | 粒度 | 含むファイル例 |
| --- | --- | --- |
| 1 | design phases 1 | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/phase-01.md` / `index.md` / `artifacts.json` 初版 |
| 2 | spec phases 4-8 | `phase-04.md`〜`phase-08.md` + `outputs/phase-04〜08/` |
| 3 | spec phases 9-13 | `phase-09.md`〜`phase-13.md` + `outputs/phase-09〜13/`（本 commit で本 phase 仕様書も含める） |
| 4 | docs Phase 12（7 ファイル + legacy stub 同期） | `outputs/phase-12/*.md` 7 件 + `completed-tasks/task-03a-stablekey-literal-lint-001.md` 更新 + skill register mapping |
| 5 | Phase 13 / artifacts 最終確定 | `outputs/phase-13/*.md` + `artifacts.json` 最終 status |

> 各 commit は revert 単位 = commit 単位を保つ。

## PR template

```
title: docs(issue-192): task-03a stableKey literal lint 仕様書作成

body:
## Summary
- Issue #192（CLOSED 維持）に対応するタスク仕様書を `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` 配下に作成
- 03a AC-7 を「規約のみ」→「静的検査 dry-run」へ昇格させる実装ドラフト（enforced_dry_run）
- ESLint custom rule で stableKey 文字列リテラルを許可外モジュールで禁止
  - allow-list: `packages/shared/src/zod/field.ts`, `packages/integrations/google/src/forms/mapper.ts` 等
- taskType: implementation / visualEvidence: **NON_VISUAL**（CI gate / lint なので画面なし）

## Test plan
- [ ] Phase 1〜10 完了（設計）
- [ ] Phase 11 NON_VISUAL evidence 計画固定（lint-violation-fail.txt / lint-clean-pass.txt / allow-list-snapshot.json）
- [ ] Phase 12 documentation 7 ファイル parity PASS
- [ ] legacy stub `## Canonical Status` 追記
- [ ] root `artifacts.json` workflow_state = `enforced_dry_run`
- [ ] mise exec -- pnpm typecheck / lint PASS
- [ ] secret hygiene grep 0 hit

## Refs
Refs #192

## Notes
- `Closes #192` は **使用しない**（issue は既に CLOSED）
- 本 PR は enforced_dry_run タスク。strict enforcement は別 wave で着手
- AC-7 表記更新（03a workflow `outputs/phase-12/implementation-guide.md`）は段階 ③ 適用 wave で同時実施を予約
```

注意:

- `Closes #192`（自動 close）は **使わない**。issue は既に closed のため `Refs #192` を採用。
- enforced_dry_run タスクのため Phase 13 完了後も strict enforcement は別 wave。本 PR merge 後、root `workflow_state` は `enforced_dry_run` を維持。

## rollback

- 仕様書のみのため、PR revert で完全に戻る
- legacy stub の `## Canonical Status` 追記は別 commit にし、revert 容易性を確保
- skill register mapping 追加も別 commit に分離可能（粒度 4 に集約）

## enforced_dry_run タスクの後続 wave 引き継ぎ

| 項目 | 後続 wave 担当 |
| --- | --- |
| ESLint custom rule 実装 | implementation wave |
| 段階 ① warning モード merge | implementation wave |
| 段階 ② 1 週間 monitor | implementation wave |
| 段階 ③ error 昇格 + AC-7 表記更新 + legacy stub 警告文撤去 | release wave（同一 wave で同時実施） |
| `workflow_state` を `completed` 昇格 | release wave Phase 12 |

## 実行タスク

- [ ] user 承認待ち（change-summary.md 提示）
- [ ] local check 実行 → `local-check-result.md` 記録
- [ ] change-summary.md 作成
- [ ] PR template 確認
- [ ] **user 承認後** push + `gh pr create`
- [ ] PR URL を `outputs/phase-13/pr-info.md` に記録

## 完了条件

- [ ] 三役ゲートすべて PASS
- [ ] PR URL 取得済み
- [ ] artifacts.json の phase 13 を completed
- [ ] root `workflow_state` を `enforced_dry_run` 維持（completed に上げない）

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 13 を completed
- [ ] PR URL を `outputs/phase-13/pr-info.md` に記録
- [ ] `Refs #192` を採用、`Closes #192` を使用していないことを確認

## 終了

本タスク完了をもって、03a AC-7 の lint enforcement 化に向けた仕様書フェーズが closed-loop 化される。
実装着手は別 wave。Issue #192 は CLOSED 維持のまま、PR merge 後に `gh issue comment` で仕様書 PR リンクを追記する運用とする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase13.md | Phase 13 approval gate |
| 必須 | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 close-out evidence |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-13/local-check-result.md` | local checks |
| `outputs/phase-13/change-summary.md` | user-facing change summary |
| `outputs/phase-13/pr-info.md` | PR URL / CI |
| `outputs/phase-13/pr-creation-result.md` | PR creation log |
