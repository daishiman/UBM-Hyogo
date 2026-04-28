# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 10 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- Phase 1 〜 Phase 9 の成果物を総合し、**GO-NO-GO 判定**を `outputs/phase-10/go-no-go.md` に記録する。
- 判定軸 1：仕様の自己完結性（branch protection / squash-only / auto-rebase / safety gate の 4 要素が網羅）。
- 判定軸 2：横断依存タスクとの非衝突（Phase 3 結果の再確認）。
- 判定軸 3：rollback 経路の確保（Phase 6 の失敗ケースに対応する recovery 手順あり）。
- 判定軸 4：品質ゲート全通過（Phase 9 の 6 ゲートすべて pass）。
- 判定軸 5：docs-only 境界の遵守（実コード変更ゼロを diff で再確認）。
- 各軸に GO / CONDITIONAL-GO / NO-GO を記録し、CONDITIONAL の場合は条件と Phase 11/12 への申し送りを記述。
- 最終 GO 判定が出た場合のみ Phase 11 へ遷移可能。NO-GO の場合は Phase 2 へ戻る経路を明示。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-10/go-no-go.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] go-no-go.md に 5 軸の判定が記録されている。
- [ ] 最終 GO / CONDITIONAL / NO-GO のいずれかが明示されている。
- [ ] artifacts.json の Phase 10 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
