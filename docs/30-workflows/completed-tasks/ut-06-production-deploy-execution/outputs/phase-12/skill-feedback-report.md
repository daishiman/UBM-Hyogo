# Phase 12: skill フィードバックレポート

本タスク実行を通じて得られた `.claude/skills/` への改善提案。

## 1. 対象 skill

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-core.md`
- `.claude/skills/aiworkflow-requirements/references/spec-update-workflow.md` (Phase 12 ルール)

## 2. 提案

### F-1: 初回デプロイ時の D1 バックアップ取扱いガイドの追記

| 項目 | 内容 |
| --- | --- |
| 対象 | `deployment-cloudflare.md` |
| 提案 | 「初回マイグレーション適用時はテーブル未作成のため `wrangler d1 export` が空 export を返す。これを `d1-backup-evidence.md` に空 export として記録することで AC-7 を満たす」旨を明記 |
| 根拠 | 本タスク Phase 5 d1-backup-evidence.md §5 で初出。skill 側にも展開すると次回再利用しやすい |
| 重要度 | MEDIUM |

### F-2: `restore-empty.sql` の雛形ガイド追加

| 項目 | 内容 |
| --- | --- |
| 対象 | `deployment-cloudflare.md` または `deployment-core.md` |
| 提案 | 初回マイグレーション失敗時の DROP SQL 雛形 (テーブル DROP) を skill サンプルに含める |
| 根拠 | 本タスク Phase 6 D-2 で必要性を確認 |
| 重要度 | MEDIUM |

### F-3: Pages 形式 vs OpenNext Workers 形式の判定フロー

| 項目 | 内容 |
| --- | --- |
| 対象 | `deployment-cloudflare.md` |
| 提案 | 「`pages_build_output_dir` の有無で形式を判定し、OpenNext 形式の場合は `main` + `compatibility_flags` を確認する」フローチャートを追加 |
| 根拠 | 本タスク Phase 2 で形式整合課題が発生。判定基準が skill にあれば次回早期検知可能 |
| 重要度 | MEDIUM |

### F-4: 本番不可逆操作の前置き checklist テンプレ

| 項目 | 内容 |
| --- | --- |
| 対象 | `deployment-core.md` |
| 提案 | 「本番不可逆操作前の必須前置き (バックアップ取得 / rollback runbook 机上確認 / 承認サイン)」を構造化テンプレとして整備 |
| 根拠 | 本タスクで preflight-checklist.md / production-approval.md として整備したが、skill 側にも雛形があると工数削減 |
| 重要度 | LOW |

### F-5: spec-update-workflow.md の Wave sync 観点強化

| 項目 | 内容 |
| --- | --- |
| 対象 | `spec-update-workflow.md` |
| 提案 | 「同 Wave 内タスクへの sync 観点」セクションが本タスク Phase 12 で必要となった。skill 側に同セクション雛形を追加 |
| 根拠 | 本タスク `system-spec-update-summary.md` §3 を参照 |
| 重要度 | LOW |

## 3. 反映アクション

- F-1 / F-2 / F-3 / F-4 の要点は本タスク内で `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` と `deployment-core.md` に反映済み
- F-5 は Phase 12 same-wave sync の観点として `phase12-task-spec-compliance-check.md` に反映済み
- 追加改善として、Phase 12 close-out 時に root / outputs `artifacts.json` parity、task root path drift、placeholder screenshot を検出する guard を `task-specification-creator` 側へ追加する

## 4. 失敗事例フィードバック

- 本タスク実行中に SubAgent (Phase 1〜8 並列実行) が outputs ディレクトリへの Write 権限を持たず停止する事象が発生
- 対策: SubAgent には書き込み対象パスを明示し、必要に応じ親 agent が書き込みを代行する運用へ
- 該当: skill ではなく Claude Code 運用ルール側のフィードバック (本書では参考情報として記載)

## 5. 追加フィードバック（Phase 12 再検証）

| ID | 対象 | 提案 | 重要度 |
| --- | --- | --- | --- |
| F-6 | `task-specification-creator` | Phase 12 完了前に root / outputs `artifacts.json` の status 差分を検出する | HIGH |
| F-7 | `task-specification-creator` | task root の実在パスと仕様書内パス参照の drift を検出する | HIGH |
| F-8 | `task-specification-creator` | `outputs/phase-11/screenshots/` の placeholder 画像を実スクリーンショットとして扱わない guard を追加する | MEDIUM |
| F-9 | `aiworkflow-requirements` | Cloudflare deployment 仕様で Pages と OpenNext Workers の旧記述が混在する場合、canonical override 節を要求する | MEDIUM |
