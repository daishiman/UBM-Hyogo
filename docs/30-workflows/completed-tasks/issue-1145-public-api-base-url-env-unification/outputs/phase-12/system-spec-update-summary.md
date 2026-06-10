> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 12 — システム仕様更新サマリ

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本ワークフローのシステム仕様（aiworkflow-requirements / CLAUDE.md 等）への反映可否を Step 単位で判定する。

## Step 1-A — workflow-local 仕様の更新

| 判定 | 内容 |
| --- | --- |
| **該当あり** | 本ワークフロー配下（`docs/30-workflows/completed-tasks/issue-1145-public-api-base-url-env-unification/`）の Phase 1-13 アウトプットを整備。env 単一化（`PUBLIC_API_BASE_URL` 削除 / rename）の scope / 削除順序 / AC を workflow-local に固定。 |

workflow-local の設計（削除順序 Step 1-7 / lane 分割 / grep gate）は全て本 workflow dir 内に閉じる。外部 spec への
新規昇格は不要。

## Step 1-B — 実装状況の記録

| key | value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（実コード・検証・正本同期完了） |
| implementation_mode | `new`（削除・rename 主体） |
| 変更ファイル | 19 ファイル（apps/web 6 + apps/og 2 + spec 11）+ `.github/workflows/*` env injection + aiworkflow 正本 |
| 実装の実行状況 | **実施済み**（grep gate・web/og tests・typecheck/lint PASS）。commit・PR・deploy・Issue mutation は user-gated |

本 Step では実装・ローカル検証・正本同期完了の状態を記録する。GitHub 操作・deploy は完了扱いしない。

## Step 1-C — 公開ドキュメント / トークン仕様の更新

| 対象 | 判定 | 理由 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/design-tokens.md` | **該当なし（不変）** | env キー変更のみ。デザイントークンに影響なし。 |
| `apps/web/src/styles/tokens.css` | **該当なし（不変）** | トークン定義に変更なし（NON_VISUAL）。 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` 等 | **該当なし** | API endpoint surface / D1 schema / Google Form 仕様に変更なし。 |
| **`CLAUDE.md`「apps/web env アクセス不変条件」** | **影響あり（記録）** | 下記参照。 |

### CLAUDE.md env 不変条件への影響（記録）

CLAUDE.md「`apps/web` env アクセス不変条件（task-02 wrangler-env-injection）」には次の不変条件がある:

- env 参照は `apps/web/src/lib/env.ts` の公開アクセサ（`getEnv()` / `getPublicEnv()` / `getAuthEnv()` /
  `getPublicFetchEnv()`）経由のみ。`process.env.*` 直接参照禁止。
- 非機密 var は `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` で管理。

本タスクの影響:

- **旧キー `PUBLIC_API_BASE_URL` を schema / accessor / wrangler `[vars]` から削除**することで、env 不変条件の
  「accessor 経由のみ」「`[vars]` 管理」を**より厳密化する方向**（重複キーの除去）。違反は導入しない。
- `getApiBaseEnv()` accessor の**削除**により、CLAUDE.md に列挙される公開アクセサ集合からは外れるが、CLAUDE.md 本文の
  アクセサ列挙（`getEnv` / `getPublicEnv` / `getAuthEnv` / `getPublicFetchEnv` / `getPublicEnv`）に `getApiBaseEnv` は
  **元々記載されていない**ため、CLAUDE.md 本文の編集は不要（記載済みアクセサに変更なし）。
- `process.env.*` 直接参照は本タスクで**増やさない**（AC-9）。env.ts accessor 経由を維持。

→ CLAUDE.md の**本文編集は不要**だが、旧キー削除が env 不変条件の方向性（重複排除・命名一貫性）と整合することを本 Step に記録する。

## Step 2 — aiworkflow-requirements system spec への env contract 反映

| 判定 | **該当あり** — current env/accessor contract を `NEXT_PUBLIC_API_BASE_URL` 単一へ同期 |
| --- | --- |

- `references/environment-variables.md` の apps/web env contract を更新し、旧 `PUBLIC_API_BASE_URL` と `getApiBaseEnv()` / `ApiBaseEnv` は issue-1145 で削除済みと明記した。
- `references/auth-google-oauth-cf-integration.md` / `testing-playwright-e2e.md` / `architecture-monorepo.md` / `lessons-fetch-service-binding-testing.md` を current key `NEXT_PUBLIC_API_BASE_URL` へ同期した。
- 公開 API surface（`apps/api/src/routes/`）・D1 schema・Google Form 仕様・design token は不変。

## Step 3 — aiworkflow workflow index への同期

| 対象 | 判定 |
| --- | --- |
| quick-reference / resource-map / task-workflow-active | implemented_local_evidence_captured workflow として反映済み |
| workflow artifact inventory | `workflow-issue-1145-public-api-base-url-env-unification-artifact-inventory.md` 作成済み |
| SKILL.md / SKILL-changelog | skill feedback 0 件のため変更なし |

## まとめ

| Step | 判定 |
| --- | --- |
| 1-A | 該当あり（workflow-local 仕様整備） |
| 1-B | `implemented_local_evidence_captured` を記録（実コード・検証・正本同期完了、commit・deploy は user-gated） |
| 1-C | design-tokens.md / tokens.css / API / D1 は不変。CLAUDE.md env 不変条件への整合（旧キー削除 = 重複排除方向）を記録。本文編集不要 |
| 2 | 該当あり（env/accessor current contract を aiworkflow 正本へ同期） |
| 3 | aiworkflow workflow index へ反映 |
