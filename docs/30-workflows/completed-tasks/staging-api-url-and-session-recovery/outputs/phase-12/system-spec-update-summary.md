# Phase 12: システム仕様反映サマリ（system-spec-update-summary）

> workflow: `staging-api-url-and-session-recovery` / taskType: implementation / NON_VISUAL / workflow_state: implemented_local_evidence_captured。
> Step1-A（完了タスク記録）/ 1-B（実装状況テーブル）/ 1-C（関連タスク）/ Step2（新規 interface のシステム仕様反映要否）を個別に記録する。
> workflow-local sync と global skill sync を別ブロックで扱う（BEFORE-QUIT-003）。

## Step 1-A: 完了タスク記録

本 wave は local 実装と Phase 1-12 証跡の確定であり、commit・PR・staging runtime は user-gated で未実施。
よって「完了タスク」は実コード / scripts / CI gate / local verification / Phase 12 strict 7 の確定を指す。

| 項目 | 内容 |
|------|------|
| タスク ID | `TASK-STAGING-API-URL-AND-SESSION-RECOVERY` |
| 完了範囲 | Phase 1-3（要件 / 設計 / 設計レビュー）+ 3 lane task spec（CONST_005 6 項目）+ Phase 12 strict 7 成果物 |
| 主目的 | staging の S2（セッション取得失敗）/ S3（localhost 焼き込み）を同一 account workers.dev loopback 404 という共通根まで遡って恒久解消するlocal実装の確定 |
| 実装状況 | implemented_local（focused Vitest 94 PASS / typecheck PASS / localhost-bake gate PASS） |
| user-gated | commit / push / PR / `cf.sh secret put` / staging deploy / runtime smoke |

## Step 1-B: 実装状況テーブル

| Lane | スコープ | 状態 | 主変更（予定） |
|------|---------|------|---------------|
| A | server-side fetch の service-binding 統一 | implemented_local | `transport.ts`（新規）/ `authed.ts` / 各 proxy・auth route / `verify-magic-link.ts` / `env.ts` |
| B | client bundle の localhost 焼き込み根絶 | implemented_local | `public.ts` / `env.ts`（`PublicFetchEnv` 拡張）/ `wrangler.toml`・`web-cd.yml` 確認 |
| C | CF secret parity + grep gate + staging smoke | implemented_local | `scripts/` 4 本（新規）/ `.github/workflows/verify-no-localhost-bake.yml`（新規）|

> artifacts.json `implementation_status = implemented_local` / `workflow_state = implemented_local_evidence_captured` と整合。Gate-A passed（spec review）/ Gate-B passed（local implementation）/ Gate-C pending（runtime は user-gated）。

## Step 1-C: 関連タスク

| 関連タスク | 関係 | 重複可否 |
|-----------|------|---------|
| `task-05a-fetchpublic-service-binding-001` | `public.ts` のみ service-binding 化した先行タスク。本 workflow がその取りこぼし（authed / proxy / auth route）を完結 | 重複なし（補完関係。public.ts の binding ロジックを再利用し新規概念を作らない） |
| `task-staging-auth-secret-binding-recovery-001` | L-AUTHSECRET-001..003（presence ≠ usability / 値非表示 / `/me` 200 で間接証明）を Lane C が継承 | 重複なし（lessons 参照） |
| `profile-reload-session-404-fix`（#1113） | trailing-slash 308 / proxy `/me/`→`/me` 整形 / 再ログイン CTA を導入。loopback 404（plain fetch）と localhost fallback は未解決 | 重複なし（本 workflow が残課題を完結） |
| task-18 grep gate（`:8888` 想定） | 専用 gate script が実在しないことを Lane C が確認し、`:8787`/`localhost` まで検出範囲を拡張 | 重複なし（gate 新設） |

## Step 2: 新規 interface のシステム仕様反映要否

本 wave で導入する新規 surface とシステム仕様（`docs/00-getting-started-manual/specs/`）への反映要否を個別判定する。

| 新規 / 拡張 surface | 種別 | システム仕様反映 | 判定根拠 |
|---------------------|------|------------------|---------|
| `transport.ts` `ApiTransportEnv` / `ApiTransport` / `resolveApiFetch` / `SERVICE_BINDING_ORIGIN` | 内部 transport helper（`apps/web` 限定） | **N/A** | 公開 API endpoint surface ではなく `apps/web` 内部の transport 選択実装。D1 schema / Google Form / API endpoint を変更しない（不変条件遵守）。specs/01-api-schema.md 等の正本仕様に影響なし |
| `env.ts` `getEnvironment()` / `getTransportRuntimeIsTest()` | 内部 env アクセサ | **N/A** | env アクセサの追加。`process.env.*` 直参照禁止の不変条件に沿った内部 helper。specs 反映不要 |
| `env.ts` `PublicFetchEnv.NEXT_PUBLIC_API_BASE_URL` | env interface 拡張 | **要確認（軽微）** | client inline env の正本は CLAUDE.md「apps/web env アクセサ不変条件」と `.dev.vars.example` / `wrangler.toml`。本変更は既存方針（`NEXT_PUBLIC_*` のみ client inline）の追認で、新規方針の追加ではない。specs への新規記載は不要だが、env キー一覧の drift がないことを確認する |
| `scripts/` 4 本 + `verify-no-localhost-bake.yml` | 運用 script / CI gate | **N/A（運用ドキュメント側）** | システム設計仕様ではなく運用・検証層。CI gate 登録（required status check）は user-gated・別途承認 |

> 結論: 公開 API / D1 schema / Google Form の正本仕様（specs/）への変更は **0 件**。すべて `apps/web` 内部 transport / env / 運用 script の範囲で完結し、不変条件（D1 直接アクセス禁止 / env アクセサ経由 / 既存 endpoint surface のみ）を維持する。

## workflow-local sync（BEFORE-QUIT-003）

| 対象 | 反映 |
|------|------|
| `index.md` | 3 lane / DoD / Phase 構成は本 Phase 12 成果物と整合済（変更不要） |
| `artifacts.json` | `phase12_strict_outputs` 7 件・`gates`（A passed / B,C pending）と本成果物が整合 |
| `outputs/phase-12/*` | 本 wave で 7 成果物を確定。compliance-check は本 wave で作成済み |
| `outputs/phase-11/manual-test-result.md` | 本 wave で生成済み（NON_VISUAL local evidence ledger） |

## global skill sync（BEFORE-QUIT-003）

| 対象 skill | 反映要否 | 根拠 |
|-----------|---------|------|
| `task-specification-creator` | **任意（候補）** | 「同一 account workers.dev loopback を service-binding で回避する web→api transport 設計」は横断ガイドライン化候補（`skill-feedback-report.md` に記載）。template 正本変更は不要 |
| `aiworkflow-requirements` | **反映済み** | `resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / `workflow-staging-api-url-and-session-recovery-artifact-inventory.md` に登録 |

> aiworkflow-requirements への導線・artifact inventory は本 wave で反映済み。task-specification-creator template への昇格は不要。
