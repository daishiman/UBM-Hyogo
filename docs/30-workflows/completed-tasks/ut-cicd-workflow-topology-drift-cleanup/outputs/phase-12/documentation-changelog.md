# Phase 12 成果物: ドキュメント変更履歴 (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 12 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |

## 変更履歴サマリー

| ファイル | 旧版 | 新版 | 変更分類 | 起源 drift |
| --- | --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | v2.1.x | **v2.2.0** | docs-only / additive | DRIFT-01 / 02 / 04(a) / 05(a) / 08 |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | v1.2.x | **v1.3.0** | docs-only / additive | DRIFT-03 / 07 / 09 / 10 |
| `docs/30-workflows/LOGS.md` | — | UT-CICD-DRIFT 行追加 | append-only | 同期 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | — | drift sync 記録 | append-only | 同期 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | — | docs-only close-out 据え置き運用実例 | append-only | 同期 |

## deployment-gha.md v2.2.0 適用差分（章単位）

| 章 | 差分内容 | 起源 |
| --- | --- | --- |
| 概要 / workflow 構成表 | `validate-build.yml` / `verify-indexes.yml` 行追加 + 「現状（2026-04-29）の current facts」注記 | DRIFT-01 |
| 環境前提 | `Node.js`: `22.x` → `24.x` / `pnpm`: `9.x` → `10.33.2` 同期 + `.mise.toml` を SSOT として明記 | DRIFT-02 |
| `ci.yml` coverage | soft → hard の段階性注記（80% threshold は別タスク `coverage-soft-to-hard-deadline-reminder-001` 委譲）| DRIFT-04(a) / 08 |
| `web-cd.yml` | Discord 通知 step 未実装である旨を「current facts」として注記。設計記述は将来仕様として保留 | DRIFT-05(a) |
| `backend-ci.yml` | 同上（Discord 通知未実装注記） | DRIFT-05(a) |
| 変更履歴テーブル | v2.2.0 行追加（日付 / UT-CICD-DRIFT / 適用 drift ID） | — |

## deployment-cloudflare.md v1.3.0 適用差分（章単位）

| 章 | 差分内容 | 起源 |
| --- | --- | --- |
| Workers section 冒頭 | 「apps/web は現状 Cloudflare Pages 形式（`pages_build_output_dir`）で運用中」current facts 注記 | DRIFT-03 |
| Pages vs Workers 判定表 | 「現状（2026-04-29）」列追加（apps/web=Pages, apps/api=Workers） | DRIFT-03 |
| API cron 表 | `0 18 * * *`（03a schema sync）行追加（既存 2 件 + 1 件 = 3 件に同期） | DRIFT-07 |
| API wrangler.toml 例 | `[[kv_namespaces]]` 例ブロックに「UT-13 採用後構成。本タスク時点では未採用」脚注追加 | DRIFT-09 |
| web-cd デプロイフロー | Pages → OpenNext Workers cutover は派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に委譲する旨を注記 | DRIFT-10 |
| 変更履歴テーブル | v1.3.0 行追加 | — |

## 旧 path 移設情報（link-checklist.md からの転記）

| 旧 path | 実 path | 影響 |
| --- | --- | --- |
| `docs/05a-parallel-observability-and-cost-guardrails/` | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/` | 死リンクなし（実体は移設済み）。本 changelog で表記揺れを併記 |

## 同期 wave（same-wave sync）

- LOGS ×2: `aiworkflow-requirements/LOGS/_legacy.md` / `task-specification-creator/LOGS/_legacy.md` 追記済み
- references ×2: `deployment-gha.md` / `deployment-cloudflare.md` 編集済み
- root LOGS: `docs/30-workflows/LOGS.md` 追記済み
- topic-map / keywords / quick-reference / resource-map: 本 phase で再生成は **任意**（drift 検出は CI gate `verify-indexes.yml` に依存）

## 完了条件チェック

- [x] 編集 2 ファイルの旧版/新版/起源 drift を表化
- [x] 章単位差分を deployment-gha.md / deployment-cloudflare.md それぞれで列挙
- [x] same-wave sync 範囲を明示
- [x] 旧 path 移設情報を併記
