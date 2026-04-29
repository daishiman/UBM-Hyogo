# documentation-changelog — 本ワークフローで追加 / 更新したドキュメント

> 本 PR は **タスク仕様書整備のみ**。実 hook 実装と smoke 実走は別 PR。changelog は spec-only PR 範囲で記録する。

## 1. ワークフロー直下（新規追加）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/skill-ledger-t6-hook-idempotency/index.md` | 新規 | タスク仕様書 index。AC-1〜AC-11、依存関係、苦戦箇所を集約 |
| `docs/30-workflows/skill-ledger-t6-hook-idempotency/artifacts.json` | 新規 | Phase 1〜13 の機械可読サマリー |
| `docs/30-workflows/skill-ledger-t6-hook-idempotency/phase-01.md`〜`phase-13.md` | 新規 | Phase 1〜13 のタスク仕様書 |

## 2. outputs（新規追加）

| パス | 種別 | 内容 |
| --- | --- | --- |
| `outputs/phase-01/main.md` | 新規 | 要件定義（背景・課題・スコープ・AC・4 条件評価） |
| `outputs/phase-02/main.md` | 新規 | 設計（トポロジ・SubAgent lane 4 本・state ownership・smoke 系列・ロールバック） |
| `outputs/phase-03/main.md` | 新規 | 設計レビュー（代替案 4 案以上 PASS/MINOR/MAJOR・着手可否ゲート） |
| `outputs/phase-04/main.md`〜`phase-10/main.md` | 新規 | テスト戦略・実装ランブック・異常系・AC マトリクス・DRY 化・品質保証・最終レビューの仕様骨格 |
| `outputs/phase-11/main.md` | 新規 | 手動 smoke サマリー（NOT EXECUTED テンプレ） |
| `outputs/phase-11/manual-smoke-log.md` | 新規 | smoke ログ記入欄（コマンド系列・PID・rc・unmerged 件数） |
| `outputs/phase-11/manual-test-checklist.md` | 新規 | 2 worktree gate / 4 worktree full / 部分 JSON リカバリ checklist |
| `outputs/phase-11/manual-test-result.md` | 新規 | 結果テンプレ（NOT EXECUTED） |
| `outputs/phase-11/link-checklist.md` | 新規 | リンク整合確認 |
| `outputs/phase-11/discovered-issues.md` | 新規 | 仕様書整備時点で検出された懸念 D-1〜D-9 |
| `outputs/phase-11/screenshot-plan.json` | 新規 | NON_VISUAL タスクのスクリーンショット不要判定 |
| `outputs/phase-12/main.md` | 新規 | Phase 12 全体まとめ（必須 5 タスクの完了状況） |
| `outputs/phase-12/implementation-guide.md` | 新規 | Part 1 中学生レベル + Part 2 技術者レベル |
| `outputs/phase-12/system-spec-update-summary.md` | 新規 | aiworkflow-requirements 反映要否マトリクス（結論: 反映なし） |
| `outputs/phase-12/documentation-changelog.md` | 新規 | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 新規 | 未タスク検出（0〜数件） |
| `outputs/phase-12/skill-feedback-report.md` | 新規 | task-specification-creator / aiworkflow-requirements skill フィードバック |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規 | 必須 5 タスクの root evidence チェックリスト |
| `outputs/phase-13/main.md` | 新規 | PR 本文案（NOT EXECUTED / pending_user_approval） |

## 3. 既存ファイルへの差分

| パス | 種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/*` | 変更なし | T-6 の AC は既存 policy（A-1 / B-1）から導かれる帰結であり、本 PR では正本に差分を入れない |
| `lefthook.yml` / `scripts/*.sh` | 変更なし | 実 hook 編集は別 PR |
| `apps/web` / `apps/api` / `.gitignore` | 変更なし | スコープ外 |
| `CLAUDE.md` | 変更なし | hook 運用方針は既に最新 |
| GitHub Issue #161 | 変更なし | CLOSED のまま運用（reopen しない） |

## 4. 変更要点（why）

- spec_created close-out のみで本 PR を完結させ、実 hook 実装 PR と smoke 実走 PR の差分単位を分離するため。
- A-1 / A-2 で確立した派生物境界を **検証段階** に固定するための AC-1〜AC-11 を Phase 1〜3 で明文化。
- 4 worktree smoke 系列の `wait $PID` 個別集約と部分 JSON リカバリループを Phase 2 / 11 / 12 で重複なく一元化。

## 5. 後続 PR で追加されるべき差分（参考）

- `lefthook.yml` の検査強化（C1）
- `scripts/<対象>.sh` の `git add` 系排除と存在スキップガード（C1）
- `outputs/phase-11/manual-smoke-log.md` / `manual-test-result.md` の実値上書き（C2）
- 必要なら `aiworkflow-requirements/references/technology-devops-core.md` への smoke 追補（例外時のみ）
