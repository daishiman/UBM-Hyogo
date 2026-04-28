# Change Summary — task-github-governance-branch-protection

## 概要

| 項目 | 値 |
| --- | --- |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| implementation_mode | new |
| 実コード変更 | **0 件**（Markdown / JSON 仕様草案のみ） |
| 影響範囲 | `docs/30-workflows/task-github-governance-branch-protection/`、`docs/00-getting-started-manual/specs/00-overview.md`、`.claude/skills/aiworkflow-requirements/` |

## 変更ファイル統計

| 種別 | 件数 | 備考 |
| --- | --- | --- |
| 新規 Markdown（phase-XX.md） | 13 | Phase 1-13 の実行タスク仕様 |
| 新規 outputs Markdown | 13 phases 分 | 下記索引参照（Phase 12 は 7 ファイル） |
| artifacts.json | 1 | Phase ごとの status を記録 |
| 正本仕様 / index | 4+ | `.claude/skills/aiworkflow-requirements/` の LOGS / deployment-branch-strategy / index 再生成 |
| getting-started manual | 1 | 現行 branch protection と governance 草案の境界を追記 |
| 実コード（.ts / .yml / .json） | 0 | 本タスクスコープ外 |

## 13 Phase × outputs 索引

| Phase | 名称 | 主要成果物 |
| --- | --- | --- |
| 1 | 要件定義 | `outputs/phase-1/main.md`（論点固定 / 命名 canonical / 横断依存洗い出し） |
| 2 | 設計草案 | `outputs/phase-2/main.md`（branch protection JSON / auto-rebase workflow / safety gate） |
| 3 | 4条件レビュー | `outputs/phase-3/main.md`（横断衝突 / GO-NO-GO） |
| 4 | 検証手段列挙 | `outputs/phase-4/main.md`（gh api dry-run / act / OPA） |
| 5 | 実装ランブック | `outputs/phase-5/main.md`（後続実装タスク向け手順） |
| 6 | 失敗ケース集 | `outputs/phase-6/main.md`（rollback / lockout 回避） |
| 7 | カバレッジマトリクス | `outputs/phase-7/main.md`（仕様要素 × Phase 対応） |
| 8 | 文書統合 Before/After | `outputs/phase-8/main.md`（重複統合差分） |
| 9 | 品質ゲート | `outputs/phase-9/main.md`（リンク・parity・行数） |
| 10 | GO-NO-GO 判定 | `outputs/phase-10/main.md` |
| 11 | NON_VISUAL マニュアル代替 | `outputs/phase-11/main.md`（リンク整合） |
| 12 | 7 ファイル | main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check |
| 13 | 完了確認 | `main.md` / `change-summary.md` / `pr-template.md` |

## 横断依存タスクとの整合

- task-conflict-prevention-skill-state-redesign — squash-only による履歴単純化と整合
- task-git-hooks-lefthook-and-post-merge — auto-rebase workflow と post-merge hook の責務分担
- task-worktree-environment-isolation — feature/* ブランチ運用と worktree 配置
- task-claude-code-permissions-decisive-mode — PR 作成権限ゲートの整合

## 後続タスク（本タスクスコープ外）

- branch protection JSON の `gh api` による本番適用
- GitHub Actions workflow ファイル（auto-rebase / safety gate）の実装と push
- pull_request_target safety gate の OPA / 自前 validator 実装
- dev / main の差分設定（レビュー人数 1 / 2、status checks の追加）
- required status checks 8件の実在 job 名同期
- docs-only / NON_VISUAL Phase 縮約テンプレの skill backlog 化
- Web deploy target の Pages / Workers(OpenNext) 正本整合
- third-party GitHub Action pin / allowlist 方針

## ユーザー承認なしの commit / push / PR 作成は行わない
