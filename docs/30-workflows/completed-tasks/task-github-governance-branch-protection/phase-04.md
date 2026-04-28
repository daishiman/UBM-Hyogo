# Phase 04: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 4 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 検証手段を列挙する：(1) `gh api` の dry-run（GET で現状確認、PUT は staging リポで実施） (2) `act` による Workflow ローカル実行 (3) OPA / conftest による JSON ポリシー検証。
- branch protection JSON 草案を `gh api -X GET /repos/{owner}/{repo}/branches/{branch}/protection` の出力と diff する手順を記述。
- auto-rebase workflow を `act -W .github/workflows/auto-rebase.yml` で実行する手順とサンプル event payload の置き場所を記述。
- pull_request_target safety gate のテストケース一覧（fork PR / 同一 repo PR / labeled trigger / scheduled trigger）を `outputs/phase-4/test-matrix.md` に表形式で記述。
- OPA policy（rego）の例として「`allow_merge_commit: false` でない JSON は reject」する rule の擬似コードを記載。
- 検証用ステージングリポ（個人 fork）での dry-run 手順を明記。
- 各検証手段の所要時間と前提（gh / act / opa のインストール状況）を一覧化。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] 検証手段（gh api / act / OPA）が列挙されている。
- [ ] test-matrix.md に検証ケース表が記載されている。
- [ ] artifacts.json の Phase 4 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
