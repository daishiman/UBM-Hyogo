# Phase 12 Main — Stage 3 (Issue #608)

## 中学生レベルでのまとめ

UBM 兵庫支部会のサイトには、コードが正しく動くか自動で確かめる「テストロボット」が 3 種類います。

1. **E2E ロボット** — 実際にブラウザを動かして画面遷移を確認
2. **Lighthouse ロボット** — ページが速いか・見やすいかを点数化
3. **Coverage ロボット** — テストが書かれている割合を確認

このタスクでは、それぞれのロボットを「動くけどスルーされる」状態から「ロボットが落ちたら本番コードに合体できない」鍵に昇格させました。鍵を担当する「ブランチプロテクション」の鍵リストに `e2e-tests-coverage-gate` と `lighthouse-ci` を追加し、Lighthouse ロボットがサーバーの起動を待つ仕組みを `wait-on` という安定した道具に置き換えています。

## Status

`implemented_local_runtime_pending / implementation / NON_VISUAL`

ローカル実装と Phase 11 の `apply` / `verify` evidence は取得済み。PR の `gh pr checks` required 表示と Lighthouse workflow run の runtime evidence は user-gated。

## Sub-output へのリンク

| Output | Path |
| --- | --- |
| Implementation Guide | `./implementation-guide.md` |
| System Spec Update Summary | `./system-spec-update-summary.md` |
| Documentation Changelog | `./documentation-changelog.md` |
| Phase 12 Task-Spec Compliance Check | `./phase12-task-spec-compliance-check.md` |
| Skill Feedback Report | `./skill-feedback-report.md` |
| Unassigned Task Detection | `./unassigned-task-detection.md` |
| Phase 11 Evidence Boundary | `../phase-11/main.md` |

## 要点 3 行

- `required_status_checks.contexts` に `e2e-tests-coverage-gate` + `lighthouse-ci` を追加し dev / main を 5 contexts に揃えた。
- `apply.sh` は fresh GET ベースで「CLAUDE.md 不変条件のみ明示正規化、他 optional fields は保持」する境界線で実装した。
- `lighthouse.yml` の起動待ちを `nohup` + `wait-on` 化し、main PR からも `lighthouse-ci` check が生成される構成にした。

## Phase 2（直列編集）への引き渡し

`.claude/skills/aiworkflow-requirements/` 配下の正本仕様への反映内容は `system-spec-update-summary.md` を SSOT として扱う。Phase 2 エージェントは同ファイルの「同期スコープ」「適用順序」セクションに従って編集する。
