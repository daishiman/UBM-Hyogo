# Phase 11: 手動テスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 11 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |

## 目的

GitHub branch protection / squash-only / auto-rebase workflow 草案を仕様化する。

## 実行タスク

- NON_VISUAL マニュアル代替記録を作成する。本タスクは UI 変更を伴わないため、視覚証跡の代わりに「リンク整合 + テキスト整合」を証跡として残す。
- `outputs/phase-11/manual-smoke-log.md` に手動チェックの結果を記録：phase-XX.md / outputs / artifacts.json の相互参照が解決可能か、`grep` ベースで確認した結果。
- `outputs/phase-11/link-checklist.md` にリンク一覧を作成：各 phase-XX.md → outputs / 横断依存タスクへのリンクを表で網羅し ✓ / ✗ を付与。
- 想定読者（後続実装タスクの担当 / レビュアー）が docs から実装ランブック（Phase 5）に到達できる経路を確認。
- 表記ゆれ（dev/develop, main/master, branch protection vs ブランチ保護）を最終確認。
- artifacts.json と本文の status 同期を最終確認。
- 視覚証跡を必要としない理由（NON_VISUAL）を明記し、後続実装タスクで visual evidence が必要になる場合の引き継ぎ事項を記述。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `CLAUDE.md`
- `docs/01-infrastructure-setup/`

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは後続実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

## 完了条件

- [ ] manual-smoke-log.md と link-checklist.md が作成されている。
- [ ] リンク切れがゼロであることが記録されている。
- [ ] artifacts.json の Phase 11 status が更新されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
