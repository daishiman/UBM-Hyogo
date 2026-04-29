# Phase 12 outputs / system-spec-update-summary — システム仕様更新サマリー

## Step 1-A: 完了タスク記録 + 関連 doc リンク + LOGS.md×2 + topic-map

| 同期対象 | 記述内容 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | UT-27 Phase 1〜13 の `spec_created` 行追記（Phase 1〜3 = completed / Phase 4〜13 = pending/reserved） | 同期済み |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | `LOGS.md` は存在しないため、既存配置を確認。今回の必須同期対象からは除外し、skill feedback に改善候補として残す | 対象外（パス補正） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `deployment-gha.md` / `deployment-secrets-management.md` / `environment-variables.md` への UT-27 反映見出しを index 再生成で同期 | 同期済み |
| `CLAUDE.md`「シークレット管理」章 | CLAUDE.md は一次正本（ローカル `.env` / CLI ルール）を保持。UT-27 固有の GitHub 派生コピー運用は aiworkflow-requirements 3 正本へ集約 | 追記不要 |
| 関連 doc リンク | 親タスク `unassigned-task/UT-27-...md` と本ワークフローの双方向リンク追加 | 予約（Phase 13 PR 前確認） |

**Step 1-A 判定: REQUIRED**

## Step 1-B: 実装状況テーブル更新

| 同期対象 | 記述内容 | 状態 |
| --- | --- | --- |
| `docs/30-workflows/LOGS.md` | `ut-27-github-secrets-variables-deployment` 行を `spec_created` に更新 | 同期済み |
| `unassigned-task/UT-27-...md` | 本ワークフローへのリンク追加 | 予約（親仕様の既存参照を維持） |

**Step 1-B 判定: REQUIRED**

## Step 1-C: 関連タスクテーブル更新

| 区分 | 関連タスク | 双方向リンク内容 | 状態 |
| --- | --- | --- | --- |
| 上流 | UT-05（CI/CD パイプライン実装） | UT-27 への参照リンク追加 | 予約（Phase 13 PR 前確認） |
| 上流 | UT-28（Cloudflare Pages プロジェクト作成） | UT-27 への参照リンク追加 | 予約（Phase 13 PR 前確認） |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | UT-27 への参照リンク追加 | 予約（該当 workflow 位置確認後） |
| 下流 | UT-06（本番デプロイ実行） | UT-27 完了が前提である旨追記 | 予約（Phase 13 PR 前確認） |
| 下流 | UT-29（CD 後スモーク） | `CLOUDFLARE_PAGES_PROJECT` 再利用の旨追記 | 予約（Phase 13 PR 前確認） |
| 関連 | UT-25（Cloudflare Secrets / SA JSON deploy） | 責務境界（GitHub 側 vs Cloudflare 側）追記 | 予約（Phase 13 PR 前確認） |

**Step 1-C 判定: REQUIRED / 実リンク更新は未完（Phase 13 PR 前確認へ予約）**

本 Phase 12 では関連タスクへの反映要否と対象を確定した。実ファイル更新は未実施のため「同期済み」とは扱わず、Phase 13 の承認ゲート前チェックに残す。

## 上流 3 件完了前提の 5 重明記（5 箇所目）

> Phase 1 §依存境界 / Phase 2 §依存タスク順序 / Phase 3 §着手可否ゲート / Phase 11 manual-smoke-log.md STEP 0 / 本サマリ §Step 1-C で 5 重明記。

## Step 2: aiworkflow-requirements 仕様更新 = REQUIRED

**判定理由**:
- 本タスクは GitHub Secrets / Variables / Environments の配置設計を新規確定する。
- apps/web / apps/api / D1 / IPC 契約 / UI 仕様は変更しない。
- ただし、運用正本である以下 3 ファイルには UT-27 の配置決定マトリクスと 1Password 同期手順を反映する必要がある:

| 同期対象 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | Secret/Variable 配置決定マトリクス（4 件）を追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 1Password 一時環境変数 + unset パターン / 同名併存禁止 / API Token 最小スコープを追記 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 1Password 正本 + GitHub 派生 + Last-Updated メモ運用を追記 |

**Step 2 判定: REQUIRED → 同期済み**（理由: Secret/Variable 配置決定マトリクスの新規導入 + 1Password 同期手順の運用正本化）
