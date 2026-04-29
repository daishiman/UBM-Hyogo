# Phase 02: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 2 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

`pull_request_target` safety gate の dry-run と security review を実行するための **責務分離設計** を仕様化する。triage（label 操作・auto-merge 判定）と untrusted build（PR code の checkout / install / test）を 2 つの workflow に分割し、それぞれの permissions / trigger / 失敗時挙動を design.md に固定する。

## 実行タスク

- 責務分離設計を `outputs/phase-2/design.md` に記述する：
  - `pr-target-safety-gate.yml`：trigger = `pull_request_target`、用途 = triage のみ（label 適用 / auto-merge 判定 / コメント投稿）。**PR head は checkout しない**。`actions/checkout` を使う場合は `ref: ${{ github.event.pull_request.base.sha }}` のみ許可。
  - `pr-build-test.yml`：trigger = `pull_request`、用途 = untrusted build / lint / test。`permissions: { contents: read }` のみ。secrets を参照しない。
- workflow デフォルト `permissions: {}` を全 workflow に固定し、必要な job だけ最小権限で昇格する設計を記述する。
- 全 `actions/checkout` ステップに `persist-credentials: false` を強制する旨を design.md に記述。
- fork PR の保護方針を整理する：
  - fork PR は `pull_request_target` で **コード実行しない**（triage で label を読むのみ）。
  - fork PR の build/test は `pull_request` workflow で行い、secrets / token を参照しない。
  - approve-and-run（labeled / authorize ラベル）の有無と運用ルールを記述。
- "pwn request" パターン非該当の根拠を 5 箇条で整理する：(1)`pull_request_target` で PR head を checkout しない、(2)`workflow_run` を介して secrets を fork PR build へ橋渡ししない、(3)`pull_request_target` から script で `${{ github.event.pull_request.head.* }}` を eval しない、(4)`persist-credentials: false`、(5)`permissions:` をジョブ単位で最小化。
- ロールバック設計：safety gate 適用前の workflow 構成へ戻す **単一コミット粒度** の手順（`git revert` 1 件 + branch protection の required status checks 名同期）を記述。
- 既存 workflow 群（`.github/workflows/*.yml`）を棚卸しし、`pull_request_target` を使っている workflow / 使っていない workflow を design.md に表で列挙する旨を記述（実走は Phase 5）。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md`
- `https://securitylab.github.com/research/github-actions-preventing-pwn-requests/`
- `https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target`

## 成果物

- `outputs/phase-2/main.md`
- `outputs/phase-2/design.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。design.md にテスト観点（fork PR / same-repo PR / labeled / scheduled）の入口を記述するに留める。

## 完了条件

- [ ] `pull_request_target` と `pull_request` の責務分離設計が design.md に記述されている。
- [ ] workflow デフォルト `permissions: {}` 方針が記述されている。
- [ ] 全 `actions/checkout` への `persist-credentials: false` 強制が記述されている。
- [ ] "pwn request" 非該当の 5 箇条が記述されている。
- [ ] ロールバック設計（単一 revert コミット粒度）が記述されている。
- [ ] artifacts.json の Phase 2 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
