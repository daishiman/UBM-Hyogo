# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 2 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

上流 dry-run 仕様（`outputs/phase-2/design.md`）の責務分離設計を、**実 workflow ファイル `.github/workflows/pr-target-safety-gate.yml` と `.github/workflows/pr-build-test.yml` の編集差分**に落とし込むための実装設計を `outputs/phase-2/design.md` に固定する。Phase 5 の runbook で適用する diff の構造、permissions 階層、required status checks の job 名同期方針、ロールバック粒度をここで決定する。

## 実行タスク

- 責務分離の実装設計を `outputs/phase-2/design.md` に記述する：
  - `.github/workflows/pr-target-safety-gate.yml`：trigger = `pull_request_target`（types: opened / synchronize / labeled / reopened）。用途は label 適用・auto-merge 判定・コメント投稿のみ。**PR head は checkout しない**。`actions/checkout` を使用する場合は `ref: ${{ github.event.pull_request.base.sha }}` のみを許可（base SHA 固定）。
  - `.github/workflows/pr-build-test.yml`：trigger = `pull_request`（types: opened / synchronize / reopened）。用途は untrusted build / lint / test。`permissions: { contents: read }` のみ。secrets を一切参照しない。
- workflow デフォルト `permissions: {}` を両 workflow の top-level に固定し、各 job が必要最小権限のみを宣言する設計（例: triage は `pull-requests: write` のみ、build は `contents: read` のみ）を design.md に記述する。
- 全 `actions/checkout` ステップに `persist-credentials: false` を強制する。既存 workflow 群で抜けている箇所を Phase 5 で `grep` 検出し、本タスク内で同時修正する範囲を design.md に列挙する。
- fork PR 保護方針を実装観点で整理する：
  - fork PR は triage workflow でコード実行しない（label / metadata のみ参照）。
  - fork PR の build / test は `pull_request` workflow で行い、secrets / GITHUB_TOKEN の高権限を参照しない。
  - approve-and-run のラベル運用ルール（`safe-to-test` 等）が必要かどうかを評価し、MVP では未採用とする旨を design.md に明記する。
- "pwn request" 非該当 5 箇条を実装側の検証手段とともに表化する：(1) PR head 非 checkout、(2) `workflow_run` 非採用、(3) `${{ github.event.pull_request.head.* }}` を script で eval しない、(4) `persist-credentials: false`、(5) job 単位で `permissions:` を最小化。各箇条に「Phase 5 で適用する diff の検証コマンド」「Phase 11 dry-run での目視確認手段」を併記する。
- ロールバック設計を確定する：safety gate 適用前へ戻す **単一 `git revert` コミット粒度** を design.md に固定し、適用後に required status checks 名が drift した場合の検知コマンド（`gh api repos/:owner/:repo/branches/main/protection`）を併記する。
- required status checks の job 名同期方針：本タスクで新設する job 名（例: `pr-target-safety-gate / triage`、`pr-build-test / build-test`）を branch protection の `required_status_checks.contexts` と一致させる。drift 防止のため Phase 5 / Phase 11 で `gh api` 結果を VISUAL evidence と並べて記録する手順を design.md に記す。
- 既存 `.github/workflows/*.yml` の棚卸し方針を記述（`pull_request_target` 使用 workflow / `actions/checkout` 使用 workflow の表は Phase 5 で実走して埋める）。

## 参照資料

- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-2/design.md`
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-3/review.md`
- `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`
- `docs/30-workflows/completed-tasks/UT-GOV-007-github-actions-action-pin-policy.md`
- `https://securitylab.github.com/research/github-actions-preventing-pwn-requests/`
- `https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target`

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 統合テスト連携

design.md にテスト観点（fork PR / same-repo PR / labeled / workflow_dispatch audit の 4 系統）と「permissions / persist-credentials / job 名同期」の検証ポイントを記述する。実走は Phase 11（手動テスト）で行い、`actionlint` / `yq` / `grep` の静的検査は Phase 5 / Phase 9 で実行する。

## 完了条件

- [ ] `pull_request_target` triage workflow と `pull_request` build/test workflow の責務分離設計が実ファイルパス付きで design.md に記述されている。
- [ ] workflow デフォルト `permissions: {}` と job 単位最小昇格の方針が記述されている。
- [ ] 全 `actions/checkout` への `persist-credentials: false` 強制方針が記述されている。
- [ ] "pwn request" 非該当 5 箇条が実装側の検証手段とともに表化されている。
- [ ] ロールバック設計（単一 `git revert` コミット粒度）と required status checks 名 drift 検知コマンドが記述されている。
- [ ] required status checks の job 名同期方針が記述されている。
- [ ] artifacts.json の Phase 2 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
