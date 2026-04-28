# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 9 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- 品質ゲートを `outputs/phase-9/quality-gate.md` に列挙する。
- ゲート 1：リンク整合性チェック — phase-XX.md / outputs / artifacts.json 間の相互リンクが全て解決可能。
- ゲート 2：parity チェック — phase-XX.md の「成果物」欄と outputs/phase-N/ 配下の実ファイルが一致。
- ゲート 3：行数チェック — 各 phase-XX.md が 50〜120 行に収まる。
- ゲート 4：用語 canonical チェック — `branch protection JSON` / `auto-rebase workflow` / `pull_request_target safety gate` の表記揺れなし。
- ゲート 5：禁止文言チェック — 「commit します」「push します」等、承認前 commit を示唆する文言なし。
- ゲート 6：横断依存タスクへの参照リンク切れなし。
- 各ゲートに合否判定基準と検査コマンド（grep / 手動確認）を記載。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/quality-gate.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] quality-gate.md に 6 ゲート以上が列挙されている。
- [ ] 各ゲートの合否判定基準が明示されている。
- [ ] artifacts.json の Phase 9 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
