# Workflow: issue-667-stage3b-mock-api-fixture-coverage

> **[実装区分: 実装仕様書]**
> 根拠: CONST_004 デフォルト。Issue #667 AC-MOCK-01..05 はすべてコード変更（`scripts/e2e-mock-api.mjs` 拡張・`packages/contracts/` 新設・契約テスト追加・`.github/workflows/e2e-tests.yml` 改修）を伴う。
> 親ソース仕様: `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md`
> 親 workflow: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate/`
> 関連 Issue: GitHub Issue #667（CLOSED のまま）/ Refs #650, #203

## メタ情報

| key | value |
|-----|-------|
| workflow ID | `issue-667-stage3b-mock-api-fixture-coverage` |
| 親 workflow | `e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate`（completed-tasks） |
| 起票元 Issue | #667（CLOSED 2026-05-14） |
| 対象成果物 | `scripts/e2e-mock-api.mjs`（拡張）/ `packages/contracts/`（新設）/ `scripts/__tests__/e2e-mock-api.contract.spec.ts`（新規）/ `.github/workflows/e2e-tests.yml`（readiness wait + log artifact upload） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| Implementation Mode | `existing-hardening`（既存 mock / E2E workflow の hardening + contracts パッケージ新設） |
| 行数目安 | mock 463 → 700-900 行 / contracts ~400 行 / contract test ~250 行 / workflow patch ~30 行 |
| priority | HIGH（Issue label `priority:high`） |
| scale | medium（Issue label `scale:medium`） |
| workflow_state | `runtime_pending`（implemented-local / CI runtime pending） |
| Phase 12 status | 完了（strict 7 + local evidence 同期済） |
| 作成日 | 2026-05-14 |

## スコープ（CONST_007 準拠）

本 workflow が生成する全 Phase は **後続実装プロンプト（03.実装.md）の 1 サイクル内で完了するスコープ**に収める。先送り・別 PR 化なし。

| 含む | 含まない |
|------|---------|
| `packages/contracts/` 新規パッケージ（mock/API/web から参照する zod schema SSOT）/ `scripts/e2e-mock-api.mjs` の endpoint 網羅拡張・zod parse 必須化・seed 強化 / `scripts/__tests__/e2e-mock-api.contract.spec.ts` 新設 / `.github/workflows/e2e-tests.yml` の readiness wait + log artifact upload / `ci.yml` test job または root `pnpm test` 経路への組込 / 既存 E2E spec の green 維持 | `apps/api` 側の業務ロジック改変 / 新規 API endpoint 追加 / D1 schema 変更 / hard gate 自体の branch protection PUT 変更（#608 / 3c の責務） |

### スコープ確定の根拠

- `packages/contracts/` 新設は AC-MOCK-02 充足の最小手段（apps 間循環参照禁止の不変条件と整合）
- 契約テストは Vitest（既存 `.github/workflows/ci.yml` の test job または root `pnpm test` 経路に組込）で完結。新 CI workflow は作らない
- readiness wait は curl による最大 30 秒のヘルスチェックループ。新規 healthcheck script は作らない

## 不変条件

1. `apps/api` ↔ `apps/web` 間の循環参照禁止 → schema 共有は `packages/contracts/` 経由のみ
2. mock は D1 を一切触らない（既存不変条件継続）
3. `apps/web/src` 配下に `127.0.0.1:8787` 等のローカル限定 endpoint を焼き込まない（task-18 grep gate 継続）
4. mock の業務 endpoint レスポンスは `schema.parse()` を必ず通してから返す（parse 失敗 = HTTP 500 + zod issue body）。例外は `/health` と `/__test__/*` control endpoint のみ
5. 新規 fixture 追加禁止（既存 Playwright `auth.ts` の 3 ロール fixture のみ）
6. seed データの canonical 値は `packages/contracts/` 配下の `fixtures.ts` に固定し、mock / contract test 両方から import する（drift 防止）
7. workflow_state vocabulary は canonical のみ（`spec_created` / `runtime_pending` / `completed`）

## 正本同期

| 項目 | 同期先 | 同期 wave |
|------|--------|-----------|
| aiworkflow quick-reference / resource-map / task-workflow-active | `.claude/skills/aiworkflow-requirements/` | Phase 12 strict 7 outputs |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory.md` | Phase 12 |
| 元 unassigned task | `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md` を `formalized` に更新 | Phase 12 |
| lessons-learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md` を本 workflow リンクで追記 | Phase 12 |

## 受け入れ基準（Issue #667 AC-MOCK-01..05 を本仕様で展開）

- **AC-1 (AC-MOCK-01 網羅)**: `apps/api/src/routes/**` のうち `apps/web` E2E が叩く endpoint を mock が返す。最低限カバー: `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request`, `/public/stats`, `/public/members`, `/public/members/:id`, `/public/form-preview`, `/admin/dashboard`, `/admin/members`, `/admin/members/:id`, `/admin/tags/queue`, `/admin/schema`, `/admin/schema/diff`, `/admin/meetings`, `/admin/meetings/:id`, `/admin/meetings/:id/attendance`, `/admin/requests`, `/admin/requests/:id/resolve`, `/admin/identity-conflicts`, `/admin/identity-conflicts/:id/merge`, `/admin/identity-conflicts/:id/dismiss`, `/admin/audit`。POST/PATCH/DELETE の `{ok:true}` fallthrough は廃止。
- **AC-2 (AC-MOCK-02 contract SSOT)**: `packages/contracts/src/` から zod schema を共有 export。mock 側で業務 endpoint について `schema.parse(payload)` を通す。parse 失敗時 HTTP 500 + body `{ zodIssues: [...] }`。`/health` と `/__test__/*` は readiness/control 用の明示例外。
- **AC-3 (AC-MOCK-03 契約テスト)**: `scripts/__tests__/e2e-mock-api.contract.spec.ts` を新設。`node scripts/e2e-mock-api.mjs` を起動 → 全 endpoint へ HTTP request → contracts zod schema で再 parse することを assert。既存 `.github/workflows/ci.yml` の test job または root `pnpm test` 経路から実行（新規 workflow 作らない）。
- **AC-4 (AC-MOCK-04 seed 強化)**: `packages/contracts/src/fixtures.mjs` に member 3 件・zone 2 種・membership type 2 種・negative case (`zzz_no_match_zzz`)・tag facet 2 種を含む seed を集約。mock / contract test の両方から import。
- **AC-5 (AC-MOCK-05 CI 健全化)**: `.github/workflows/e2e-tests.yml` で `curl -sf http://127.0.0.1:8787/health` を最大 30 秒リトライする readiness wait を Playwright 起動前に挿入。`/tmp/e2e-mock-api.log` を `actions/upload-artifact@v4` (retention 7 日) で取得可能化。
- **AC-6 (regression 不在確認)**: 既存 E2E spec（`task10-ui-primitives.spec.ts` / `admin-identity-conflicts.spec.ts` 等）が新 mock で green を維持する。
- **AC-7 (型・lint・カバレッジ)**: `pnpm typecheck` / `pnpm lint` PASS。Vitest coverage `Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80%`（packages/contracts / scripts 配下の追加分）。`bash scripts/coverage-guard.sh` exit 0。

## 参考: 既存実装の検査結果（Phase 2 既存実装検査ゲート）

| 対象 | 状態 | 根拠 |
|------|------|------|
| `scripts/e2e-mock-api.mjs` | 既存（463 行・最小実装） | head/grep 確認済 |
| `packages/contracts/` | 不在（新設） | `ls packages/` で `integrations`/`shared` のみ |
| `scripts/__tests__/` | 不在（新設） | `find scripts -name "*.spec.*"` で `cf-audit-log/__tests__` `smoke/__tests__` のみ |
| `.github/workflows/e2e-tests.yml` mock 起動 | 既存（L42-43）・readiness wait & log upload 不在 | `grep -n "e2e-mock-api\|curl\|upload-artifact"` 確認済 |

分類: **既存 workaround の hardening / formalize 系 follow-up タスク**（greenfield ではない）。Phase 3 ラベル: `existing-hardening`。

## ディレクトリ

```
docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/
├── index.md
├── artifacts.json
├── phase-1.md .. phase-13.md
└── outputs/
    ├── phase-1/  (Phase 1 成果物配置)
    ├── ...
    └── phase-13/
```

## 関連リンク

- Issue #667: https://github.com/daishiman/UBM-Hyogo/issues/667
- 親 Issue #650 (3b parent)
- Issue #203 (task-specification-creator template hardening)
- Lessons learned: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md`
- 元 unassigned task: `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md`
