# Phase 2 成果物: 正本仕様の更新方針 (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 2 / 13（設計：差分マトリクス設計） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup |
| 連動成果物 | drift-matrix-design.md |

---

## 1. 更新対象正本仕様

| 仕様書 | パス | 役割 |
| --- | --- | --- |
| `deployment-gha.md` | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | GitHub Actions CI/CD 正本 |
| `deployment-cloudflare.md` | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare deploy target 正本 |

> 実体ファイル編集は **Phase 12** で実施。本 Phase は更新方針の固定のみ。

---

## 2. `deployment-gha.md` の更新方針

| 更新セクション | 更新粒度 | drift ID 起源 | 更新内容（要約） |
| --- | --- | --- | --- |
| `## CI ワークフロー要件（PR 時）` の「実行ステップ」 | 数行修正 | DRIFT-01 | `pnpm 9.x` → `pnpm 10.33.2`、`Node.js 22.x LTS` → `Node.js 24`（`.mise.toml` と整合） |
| `## ワークフロー構成` 表 | 表に行追加 | DRIFT-02 | `validate-build.yml`（ビルド検証）、`verify-indexes.yml`（aiworkflow-requirements skill indexes drift 検出）の 2 行を追加 |
| `## CD ワークフロー要件（dev / main マージ時）` の通知要件 | 注記追加 | DRIFT-04 | 「現状実装では Discord Webhook 通知ステップ未実装。UT-08-IMPL（観測性実装）で導入予定」と注記。UT-CICD-DRIFT では通知実装派生を起票しない |
| `## Backend ワークフロー要件（dev / main マージ時）` の通知要件 | 注記追加 | DRIFT-05 | DRIFT-04 と同方針 |
| `### 品質ゲート` の Codecov 80% 閾値記述 | 注記追加 | DRIFT-08 | 「PR1/3 段階では `coverage-gate` job が `continue-on-error: true` の soft gate。PR3/3 で hard gate 化」と段階性を明記。既存タスク `coverage-80-enforcement` への参照を追加 |
| `## キャッシュ戦略` / `## 並列実行の活用` のテストシャード/Vitest 並列化 | 段階性注記 | DRIFT-08 関連 | テストシャード 16 並列等の記述は将来構成として明記（実体未実装である旨） |

更新粒度の方針:
- **section 単位の rewrite ではなく、行単位の修正と注記追加** を基本とする（既存ガバナンス文書の書式を保つ）。
- 各 drift ID を inline コメント（HTML コメント `<!-- DRIFT-NN -->`）として記述するかは Phase 5 で決定。

---

## 3. `deployment-cloudflare.md` の更新方針

| 更新セクション | 更新粒度 | drift ID 起源 | 更新内容（要約） |
| --- | --- | --- | --- |
| `## Cloudflare Workers デプロイ（Next.js / OpenNext）` 冒頭 | 注記追加 | DRIFT-03 / DRIFT-07 | 「現状 `apps/web/wrangler.toml` は Pages 形式（`pages_build_output_dir = ".next"`）で運用。OpenNext Workers 形式への cutover 判断は派生 `UT-CICD-DRIFT-IMPL-001-pages-vs-workers-decision` で実施」を冒頭に明記 |
| `### Pages 形式と OpenNext Workers 形式の判定` 表 | 表の状態列追加 | DRIFT-03 | 「現状（2026-04-29）」列を追加し、`apps/web` が Pages 形式である事実を表内に明示 |
| `## GitHub Actions CI/CD` の「デプロイフロー（web-cd.yml）」 | 注記追加 | DRIFT-07 | 「Pages 形式運用中の現行フロー。OpenNext 形式へ cutover 後は `wrangler deploy --env <env>` に置換予定（派生タスク参照）」 |
| `### API Worker cron / Forms response sync（03b）` | 表に行追加 | DRIFT-10 | cron 表に `0 18 * * *`（03a schema sync, 03:00 JST）を追加し、`apps/api/wrangler.toml` の `crons = ["0 */6 * * *", "0 18 * * *", "*/15 * * * *"]` と完全整合させる |
| `### wrangler.toml（API Workers）` 例 | 例コードの注記 | DRIFT-09（drift 記録のみ） | KV binding 例は UT-13 採用後の構成として記述されている旨を明記。`apps/api/wrangler.toml` 現状にはまだ KV binding 未追加である事実を脚注に追加 |
| `## 環境分離` 表 | 整合性確認のみ | — | `ubm-hyogo-web-staging` / `ubm-hyogo-web` の Pages プロジェクト名と `apps/web/wrangler.toml` の `[env.staging] name` / `[env.production] name` が整合しているため変更不要 |

更新粒度の方針:
- 二系統混在（Pages vs OpenNext Workers）は **本タスクでは判断保留** として記述。判断後の rewrite は派生タスクで実施。
- 既存の OpenNext Workers wrangler.toml 例（`main = ".open-next/worker.js"`）は **削除せず**、現状（Pages 形式）と将来構成（OpenNext Workers 形式）の両方が読み手に分かるよう注記で補強。

---

## 4. 05a observability-matrix.md への波及（参考、本タスクでは編集しない）

DRIFT-06（observability-matrix.md が一部 workflow を未列挙）は本タスクで編集しない。`05a-parallel-observability-and-cost-guardrails` は completed-tasks 配下にあり、必要時のみ派生 `UT-CICD-DRIFT-IMPL-004-observability-matrix-extend` を起票して扱う。

---

## 5. 更新の適用順（Phase 12 で実施）

Phase 12 で正本仕様を編集する際の推奨順:

1. **DRIFT-01**（pnpm/Node バージョン）— 最小リスク、行単位修正
2. **DRIFT-02**（workflow 構成表に 2 行追加）— 追加のみ、既存記述は変更せず
3. **DRIFT-10**（API Worker cron 03a 行追加）— 追加のみ
4. **DRIFT-08**（coverage-gate 段階性注記）— 注記追加
5. **DRIFT-04 / DRIFT-05**（Discord 通知未実装の注記）— a 案採用時のみ注記追加
6. **DRIFT-07**（cloudflare.md 内の Pages vs OpenNext 同居の注記）— 表/フロー両方に注記
7. **DRIFT-03**（apps/web 現状 Pages 形式の冒頭注記）— DRIFT-07 と連動
8. **DRIFT-09**（API wrangler.toml 例の KV 未適用脚注）— 脚注追加

---

## 6. 派生タスク起票指示（impl 必要差分の起票方針）

drift-matrix-design.md §6 のテンプレに従い、Phase 12 で以下を `unassigned-task/` に起票（base case）。

| 派生タスク ID | 起票元 drift ID | 優先度 | 起票要否（base case） |
| --- | --- | --- | --- |
| `UT-CICD-DRIFT-IMPL-001-pages-vs-workers-decision` | DRIFT-03 / DRIFT-07 | HIGH | **要起票**（Pages vs OpenNext Workers cutover 判断と実施） |
| Discord 通知実装 | DRIFT-04 / 05 | LOW | 起票見送り（base case は docs-only 案 a。UT-08-IMPL で吸収し、UT-CICD-DRIFT では派生IDを作らない） |
| `UT-CICD-DRIFT-IMPL-004-observability-matrix-extend` | DRIFT-06 | LOW | Phase 12 で要否再評価（必要時のみ起票） |

---

## 7. 完了条件チェック

- [x] `deployment-gha.md` の想定更新セクション・更新粒度が表化（§2）
- [x] `deployment-cloudflare.md` の想定更新セクション・更新粒度が表化（§3）
- [x] 05a への波及範囲が明記（§4）
- [x] 適用順が明記（§5）
- [x] 派生タスク起票指示が記述（§6）
- [x] 本タスクが docs-only であること、code 変更の禁則を再宣言（drift-matrix-design.md §8 と整合）
