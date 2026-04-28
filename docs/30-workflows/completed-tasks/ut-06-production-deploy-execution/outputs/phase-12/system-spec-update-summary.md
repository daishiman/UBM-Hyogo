# Phase 12: system spec 更新サマリー

## 1. 更新方針

本タスク (UT-06) は本番不可逆操作を含む implementation task だが、2026-04-27 時点では実デプロイ・D1 migration・本番 smoke test は未実行。したがって「本番デプロイ完了記録」は正本仕様へ反映しない。

一方で、今回のワークツリーには `scripts/cf.sh`、`CLAUDE.md`、`apps/api/wrangler.toml`、`apps/web/wrangler.toml`、`apps/web/next.config.ts` の運用・設定差分が存在するため、Phase 12 では「実行前の正本仕様同期」と「実行前ブロッカーの明示」を行う。

## 2. 本タスク内で反映した正本仕様

| 反映先 | 内容 | 状態 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | `scripts/cf.sh` 経由の Cloudflare CLI 実行、OpenNext/Pages 形式判定、初回 D1 backup 空 export の扱い、UT-06 実行前ブロッカーを追記 | 反映済み |
| `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | 本番不可逆操作前 checklist と UT-06 実行前ゲートを追記 | 反映済み |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | deployment 系仕様の UT-06 / cf.sh / OpenNext 判定トピックを再生成で反映 | 反映対象 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | deployment / Cloudflare 運用参照の更新を再生成で反映 | 反映対象 |

## 3. code / docs 差分との整合

| 対象 | 現状 | 判定 |
| --- | --- | --- |
| `CLAUDE.md` | Cloudflare CLI は `bash scripts/cf.sh ...` のみ使用、`.env` 実値禁止を追記済み | 反映済み |
| `scripts/cf.sh` | `op run` + `ESBUILD_BINARY_PATH` + `mise exec` で wrangler をラップ | 反映済み |
| `apps/api/wrangler.toml` | `[env.production]` を明示済み。旧 docs の「不在」記述は修正対象 | 反映済み |
| `apps/web/wrangler.toml` | `[env.production]` は明示済みだが `pages_build_output_dir = ".next"` が残る | 実行前ブロッカー |
| `apps/web/next.config.ts` | worktree root 固定と `typescript.ignoreBuildErrors = true` を追加 | build gate に別 tsc 実行を必須化 |
| `outputs/phase-11/screenshots/capture-pending.png` | 1x1 placeholder。実スクリーンショットではない | Phase 11 NOT EXECUTED として扱う |

## 4. 同 Wave 内タスクへの sync 観点

| タスク | sync 観点 | 状態 |
| --- | --- | --- |
| 02-serial monorepo-runtime-foundation | mise / pnpm / Node 固定と `@ubm-hyogo/*` package 名 | 照合済み |
| 03-serial data-source-and-storage-contract | D1 runbook と初回 backup / restore-empty 方針 | 追記候補を正本仕様へ反映 |
| 04-serial cicd-secrets-and-environment-sync | `.env` 実値禁止、1Password 動的注入、Cloudflare token scope | `CLAUDE.md` / deployment-cloudflare に反映 |
| 05b-parallel smoke-readiness-and-handoff | Phase 11 smoke / screenshot は本番実行後に実証跡化 | 未実行のため pending |

## 5. 実行前ブロッカー

| ID | 内容 | 対応 |
| --- | --- | --- |
| B-1 | `apps/web` が OpenNext Workers AC に対して Pages 形式 | UNASSIGNED-A を本番実行前ブロッカーへ格上げ |
| B-2 | `apps/api` に `/health/db` が未実装 | UNASSIGNED-H として追加 |
| B-3 | `/health` 期待 body が docs と実装で不一致 | UNASSIGNED-I として追加 |
| B-4 | CORS preflight smoke の API 実装根拠がない | UNASSIGNED-J として追加 |
| B-5 | Phase 11 実スクリーンショット未取得 | 本番 smoke 実行後に保存 |

## 6. 反映アクション

- Phase 12 成果物を「実デプロイ完了」ではなく「実行テンプレート + 実行前ブロッカー明示」に更新。
- `implementation-guide.md` を Part 1 / Part 2 構成へ更新。
- `phase12-task-spec-compliance-check.md` を追加し、30種思考法 + エレガント検証の結果を記録。
- 正本 deployment 仕様へ `cf.sh` 運用、OpenNext/Pages 判定、D1 backup 注意、不可逆操作 gate を追記。
