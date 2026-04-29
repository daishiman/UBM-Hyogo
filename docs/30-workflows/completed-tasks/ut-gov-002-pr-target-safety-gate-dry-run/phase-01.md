# Phase 01: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-pr-target-safety-gate-dry-run |
| Phase | 1 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| GitHub Issue | #145（CLOSED のまま spec_created で再構築） |

## 目的

上位原則は「trusted context では untrusted PR code を checkout / install / build / eval しない」。本 Phase ではこの原則を dry-run specification の判断基準として固定する。

`pull_request_target` safety gate の **dry-run / security review** に必要な真の論点・スコープ境界・前提条件を Phase 1 で固定し、Phase 2 以降の設計が前提なしに着手されないようにする。親タスク（task-github-governance-branch-protection）Phase 12 unassigned-task-detection.md の U-2 を formalize する第一段階。

## 実行タスク

- 真の論点を 4 つ固定する：(a)`pull_request_target` の triage 専用化、(b)`pull_request` workflow への build/test 分離、(c)fork PR シナリオでの token / secret 露出ゼロ、(d)GitHub Security Lab "pwn request" パターン非該当のレビュー観点。
- スコープ境界を確定する：本タスクは **docs-only** の dry-run specification / runbook 策定のみ。実 workflow ファイル編集（`.github/workflows/pr-target-safety-gate.yml`）と dry-run 実走は後続実装タスクの **別 PR** で行う。
- 命名 canonical を確定する：`pull_request_target safety gate` / `triage workflow` / `untrusted build workflow` / `pwn request pattern` を全 Phase で統一する。
- 横断依存タスクを洗い出す：task-github-governance-branch-protection（親）/ UT-GOV-001（branch protection apply）/ UT-GOV-007（action pin policy）の 3 件を依存対象として登録。
- 非スコープを明示する：branch protection JSON の本適用、action pin の本適用、secrets rotate、CODEOWNERS 整備、外部 CI 統合は本タスク対象外と宣言する。
- リスクを列挙する：(R-1)pwn request による secrets 漏えい、(R-2)`pull_request_target` から PR head を checkout することで untrusted code が GITHUB_TOKEN 高権限下で動く、(R-3)`persist-credentials` 未指定で残存トークンが副作用を生む。
- 用語集の初版（pull_request_target / pull_request / pwn request / triage / persist-credentials / GITHUB_TOKEN / fork PR）を `outputs/phase-1/main.md` に列挙する。
- 成果物の置き場所を `outputs/phase-1/main.md` に固定し、artifacts.json の Phase 1 セクションと整合させる。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/task-specification-creator/references/phase-template-core.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/phase-02.md`
- `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md`
- `CLAUDE.md`（ブランチ戦略 feature → dev → main）

## 成果物

- `outputs/phase-1/main.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。Phase 1 では論点・前提・スコープ境界の整合のみを検証対象とする。

## 完了条件

- [ ] 真の論点 4 つが main.md に明記されている。
- [ ] 横断依存 3 タスクが列挙されている。
- [ ] 命名 canonical が確定している。
- [ ] 非スコープ宣言（実 workflow 編集 / dry-run 実走 / secrets rotate）が明記されている。
- [ ] リスク R-1〜R-3 が main.md に列挙されている。
- [ ] artifacts.json の Phase 1 status が `spec_created` で同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
