# 04a-parallel-public-directory-api-endpoints Artifact Inventory

## メタ情報

| 項目 | 内容 |
|---|---|
| タスクID | 04a-parallel-public-directory-api-endpoints |
| タスク種別 | impl（apps/api 公開ディレクトリ API 4 endpoint 実装） |
| ワークフロー | completed（Phase 1-12 完了 / Phase 13 はユーザー承認待ち） |
| canonical task root | `docs/30-workflows/completed-tasks/04a-parallel-public-directory-api-endpoints/` |
| 同期日 | 2026-04-29 |
| owner | apps/api |
| domain | public read API / privacy boundary |
| depends_on | 02a（member identity / status / response repository） / 03a（schema sync） |

## Acceptance Criteria

詳細は `outputs/phase-07/ac-matrix.md`（AC-1 〜 AC-12）を正本とする。要点:
- 4 endpoint が `/public/*` 配下に未認証で mount されている
- 公開条件 `publishState='published' AND publicConsent='consented' AND is_deleted=0` が SQL / repository / converter の三段で適用されている
- FORBIDDEN_KEYS（`responseEmail` / `rulesConsent` / `adminNotes`）が response に絶対に含まれない
- Cache-Control が endpoint 別に正しく設定されている
- query パラメータ `q/zone/status/tag/sort/density/page/limit` が parser によりバリデーションされる
- 不変条件 #1〜#14 を 6 層 leak 防御で trace している

## Phase Outputs

| Phase | 場所 | 主要成果物 |
|---|---|---|
| 1 | `outputs/phase-01/` | 要件定義 / AC-1〜12 |
| 2 | `outputs/phase-02/` | 設計 |
| 3 | `outputs/phase-03/` | API 契約 |
| 4 | `outputs/phase-04/` | テスト戦略 / matrix |
| 5 | `outputs/phase-05/` | repository 設計 |
| 6 | `outputs/phase-06/` | view-model 設計 |
| 7 | `outputs/phase-07/` | ac-matrix.md |
| 8 | `outputs/phase-08/` | `_shared/` 共通化評価 |
| 9 | `outputs/phase-09/` | main.md（不変条件 trace） |
| 10 | `outputs/phase-10/` | E2E suite 移送判断（06a へ） |
| 11 | `outputs/phase-11/` | manual-evidence.md（7 ステップ） |
| 12 | `outputs/phase-12/` | implementation-guide.md / system-spec-update-summary.md / unassigned-task-detection.md / skill-feedback-report.md |

## 主要実装物

| ファイル | 役割 |
|---|---|
| `apps/api/src/_shared/public-filter.ts` | 公開フィルタ条件（SQL bind と converter 二重チェック） |
| `apps/api/src/_shared/pagination.ts` | PaginationMeta 算出 |
| `apps/api/src/_shared/search-query-parser.ts` | `q/zone/status/tag/sort/density/page/limit` パース |
| `apps/api/src/_shared/visibility-filter.ts` | `schema_questions.visibility` に基づく field filter（既定値 `member`） |
| `apps/api/src/repository/publicMembers.ts` | 公開フィルタ込みの list / count / exists / aggregate |
| `apps/api/src/view-models/public/public-stats-view.ts` | KPI / zone / meetings / lastSync |
| `apps/api/src/view-models/public/public-member-list-view.ts` | members list |
| `apps/api/src/view-models/public/public-member-profile-view.ts` | individual profile |
| `apps/api/src/view-models/public/form-preview-view.ts` | form preview |
| `apps/api/src/use-cases/public/{get-public-stats,list-public-members,get-public-member-profile,get-form-preview}.ts` | use case |
| `apps/api/src/routes/public/{index,stats,members,member-profile,form-preview}.ts` | Hono route（session middleware 非適用） |

`apps/api/src/index.ts` で `app.route("/public", createPublicRouter())` を `/public/healthz` 直後に mount。

## Skill 反映先（current canonical set）

| ファイル | 反映内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/public/*` 4 endpoint、認証不要、Cache-Control、公開フィルタ、query 契約 |
| `.claude/skills/aiworkflow-requirements/references/architecture-monorepo.md` | `apps/api` の Wave 0 health scaffold 記述に 04a public API 追加済み事実 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 04a Phase 1-12 close-out、Phase 11 runbook 境界、Phase 13 承認待ち |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-04a-public-api-security-layers.md` | L-04A-001〜007（6 層 leak 防御 / privacy first / FORBIDDEN_KEYS / camelCase 正規化 / leak assert テンプレ / Cache-Control 判断軸 / miniflare contract 申し送り） |

## 実装で確定した値

- `FALLBACK_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"`
- `FALLBACK_RESPONDER_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform"`
- `LIMIT_MAX = 100` / `LIMIT_MIN = 1` / `Q_MAX_LENGTH = 200`
- `FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']`
- Cache-Control: `public, max-age=60`（`/public/stats` / `/public/form-preview`） / `no-store`（`/public/members` / `/public/members/:id`）

## Follow-up 未タスク（formalize 済み）

| 未タスク ID | ファイル | 概要 | 起票元 |
|---|---|---|---|
| task-04a-followup-001 | `docs/30-workflows/unassigned-task/task-04a-followup-001-miniflare-contract-leak-suite.md` | miniflare ベース contract / integration / leak suite | U-1 / S-4 |
| task-04a-followup-002 | `docs/30-workflows/unassigned-task/task-04a-followup-002-public-member-kv-cache.md` | `/public/members/:id` の KV cache（trigger >3k/day） | U-2 |
| task-04a-followup-003 | `docs/30-workflows/unassigned-task/task-04a-followup-003-shared-query-parser-extraction.md` | `apps/web` 用 query parser を `packages/shared` 配置（06a） | U-3 |
| task-04a-followup-004 | `docs/30-workflows/unassigned-task/task-04a-followup-004-cf-cache-rules-cache-control-validation.md` | Cloudflare cache rules による Cache-Control override 検証 | U-4 |
| task-04a-followup-005 | `docs/30-workflows/unassigned-task/task-04a-followup-005-tags-bulk-fetch-n-plus-1-prevention.md` | tags 一括取得の N+1 防止（multi-member 対応） | U-5 |

## Validation Chain

| 検証項目 | 結果 |
|---|---|
| unit test（`_shared/__tests__/`, `view-models/public/__tests__/`） | PASS（47 / 47） |
| converter leak リグレッション（FORBIDDEN_KEYS / sentinel 注入） | PASS |
| visibility filter 既定値 `member` の挙動 | PASS |
| miniflare ベース contract / integration / leak suite | DEFERRED（task-04a-followup-001） |
| 不変条件 #1〜#14 trace | PASS（`outputs/phase-09/main.md`） |
| Phase 11 manual evidence（7 ステップ） | PASS（`outputs/phase-11/manual-evidence.md`） |
| Phase 13（ユーザー承認 / PR 作成） | PENDING（user approval 待ち） |
