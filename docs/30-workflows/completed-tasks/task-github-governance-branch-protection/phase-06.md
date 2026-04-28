# Phase 06: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 6 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 失敗ケース集を `outputs/phase-6/failure-cases.md` に作成する。
- ケース 1：admin が誤って `enforce_admins: true` 適用後にレビュアー不在で lockout → admin override 経路で解除。
- ケース 2：auto-rebase workflow が rebase 競合に遭遇 → ラベル `auto-rebase-failed` を付与し人手介入へフォールバック。
- ケース 3：fork PR が `pull_request_target` を悪用しようとする → `pull_request_target` 内で PR code を checkout / 実行しないことで防御。
- ケース 4：squash-only により大規模 PR で commit 履歴が消える → 大規模 PR は事前分割を推奨する運用ルール記載。
- ケース 5：required_status_checks に存在しない job 名を指定 → 永久 pending 化を回避するため job 名 canonical を Phase 1 で固定済み。
- ケース 6：CODEOWNERS 不一致による必須レビュアー指定漏れ → 後続タスクで CODEOWNERS 整備をフォロー。
- 各ケースに対する検出方法・暫定対応・恒久対応を 3 列表で整理。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] failure-cases.md に 6 ケース以上が記載されている。
- [ ] 各ケースに検出・暫定対応・恒久対応が記載されている。
- [ ] artifacts.json の Phase 6 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
