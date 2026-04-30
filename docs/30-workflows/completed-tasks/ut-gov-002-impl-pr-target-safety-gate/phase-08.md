# Phase 08: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 8 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

Phase 5 / 6 で生成した実 workflow ファイル（`.github/workflows/pr-target-safety-gate.yml` / `pr-build-test.yml`）を **before / after で再点検**し、責務分離・命名統一・重複 step 整理・コミット粒度設計の 4 観点で実装をリファクタする。レビュアビリティを最大化するため、本 Phase では「振る舞いを変える変更」を入れず、**構造整理 / 命名整合 / コミット分割計画**のみを確定させる。

## 実行タスク

- `outputs/phase-8/before-after.md` を作成し、実 workflow ファイルの修正前後の差分を表で記録する（既存 triage workflow がある場合は境界調整、無い場合は新規追加の判定根拠を記す）。
- 責務境界の判定：`pull_request_target` トリガーが label / コメント / metadata 操作にのみ使われ、`pull_request` トリガー側で untrusted build / test / install が走ることを diff レベルで再確認する。境界が曖昧な job が残っていれば本 Phase で剥がす。
- 命名統一：canonical なファイル名は `pr-target-safety-gate.yml`（trusted triage）と `pr-build-test.yml`（untrusted build）に固定する。job 名 / workflow `name:` も branch protection の required status checks 名と一致させる方針を before-after.md に記録（実反映は Phase 9 で再検証）。
- 重複 step の整理：`actions/checkout` には全箇所に `persist-credentials: false` を明示する。SHA pin（UT-GOV-007 連携）と `permissions:` 最小化の重複記述を job 単位で一本化する。共通の env / concurrency 設定は workflow 冒頭に集約する方針を記述。
- 既存 workflow の段差除去：旧来の `pull_request_target` で build/test を走らせている step が残存していれば before-after.md にリストアップし、削除（または `pull_request` 側へ移送）する位置を明示する。
- コミット分割計画：単一 PR 粒度を維持しつつ、(1) safety gate 適用（`pr-target-safety-gate.yml` 確定）、(2) 不要 step 除去（旧 trigger からの剥離）、(3) required status checks 名同期（`pr-build-test.yml` job 名 rename）の 3 コミットに分離可能な並びを before-after.md に記述。`git revert` で (1)〜(3) を個別に巻き戻せることを担保する。
- 表記整合：`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern` の 4 用語が phase-NN.md / outputs / 実 yaml コメントで揺れなく使われているか `grep` で点検する手順を記述。
- 図表の最小化：本タスクは VISUAL だが、Phase 8 は構造整理のため Mermaid を使わず Markdown table のみとする方針を再確認（VISUAL 証跡は Phase 11 が責務）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `phase-01.md` 〜 `phase-07.md`
- `outputs/phase-2/design.md`
- `outputs/phase-5/runbook.md`
- `.github/workflows/pr-target-safety-gate.yml`（実装本体）
- `.github/workflows/pr-build-test.yml`（実装本体）
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`

## 成果物

- `outputs/phase-8/main.md`
- `outputs/phase-8/before-after.md`

## 統合テスト連携

本 Phase はファイル構造整理に閉じ、振る舞いを変えない。Phase 9 quality-gate で `actionlint` / `yq` / `grep` の静的検査を再走させ、リファクタ後も静的検査 PASS が維持されていることを保証する。dry-run の再実走は Phase 11 で行う。

## 完了条件

- [ ] before-after.md に実 workflow ファイルの修正前後の差分が表で記録されている。
- [ ] `pull_request_target` から build / test / install step が剥離されていることが diff で確認されている。
- [ ] canonical 命名（`pr-target-safety-gate.yml` / `pr-build-test.yml`）と job 名同期方針が記録されている。
- [ ] `actions/checkout` への `persist-credentials: false` が全箇所明示されていることが確認されている。
- [ ] コミット分割計画（safety gate 適用 / 不要 step 除去 / required status checks 名同期）が記述されている。
- [ ] 用語整合チェック（4 用語）が `grep` 手順とともに記述されている。
- [ ] artifacts.json の Phase 8 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
