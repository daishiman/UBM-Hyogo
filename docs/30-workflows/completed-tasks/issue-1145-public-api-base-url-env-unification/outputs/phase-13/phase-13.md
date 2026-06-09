> **[実装区分: 実装仕様書]** NON_VISUAL

# Phase 13 — PR 作成（user-gated）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

本 Phase の全操作（commit / push / PR 作成 / staging+production 再 deploy / Issue mutation）は
**ユーザーの明示承認後にのみ実行する**。implemented_local_evidence_captured 時点で実装・ローカル検証・正本同期は完了しており、GitHub / deploy / Issue 操作のみ未実施。

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 13（PR 作成） |
| workflow_id | `issue-1145-public-api-base-url-env-unification` |
| status | `implemented_local_evidence_captured`（実装・ローカル検証・正本同期完了。commit・PR・deploy 未実施） |
| visual_category | NON_VISUAL |
| issue | #1145（CLOSED のまま。再 OPEN は user-gated） |
| PR base | `dev`（CLAUDE.md 既定。production リリースの `dev → main` ではない） |
| package | `@ubm-hyogo/web` / `@ubm-hyogo/og` |

## 2. implemented_local_evidence_captured 時点の事実

- 仕様書（index.md / Phase 1-13 / Phase 12 strict-7）は作成済み。
- **実コード 19 ファイルの削除 / rename、`.github/workflows/*` env injection、aiworkflow 正本同期は完了**（Gate-B passed）。
- commit / push / PR / deploy / Issue mutation は未実施（Gate-C pending）。
- branch は作業ブランチ（実装着手時に `refactor/issue-1145-public-api-base-url-env-unification` 等を自律作成）。

## 3. 実装後にユーザー承認を得てから行うこと（user-gated）

以下は**実装完了かつローカル検証 green 後**、ユーザーの明示承認を得てから順に実行する。

| # | 操作 | 承認区分 |
| - | ---- | -------- |
| 1 | `git add` / `git commit`（実装・正本同期差分） | user-gated |
| 2 | `git push`（作業ブランチ） | user-gated |
| 3 | `gh pr create --base dev`（本文は本 Phase §5 を反映） | user-gated |
| 4 | staging 再 deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` / `apps/og/wrangler.toml --env staging`） | user-gated |
| 5 | production 再 deploy（`--env production`） | user-gated |
| 6 | Issue #1145 の状態確認・mutation（必要時の再 OPEN / close コメント） | user-gated |

## 4. wrangler vars 変更と再 deploy の関係（明記）

旧 `PUBLIC_API_BASE_URL` は `apps/web/wrangler.toml` / `apps/og/wrangler.toml` の **非機密 `[vars]`**
（`[vars]` / `[env.staging.vars]` / `[env.production.vars]`）に定義されている。

- wrangler.toml の `[vars]` は **deploy 時に Worker へバンドルされる**ため、`.toml` を編集しただけでは
  staging / production の稼働中 Worker には反映されない。**再 deploy して初めて反映される**。
- 旧キー削除（apps/web）/ rename（apps/og）の vars 変更を本番反映するには、apps/web と apps/og の
  **両 Worker を staging → production の順で再 deploy** する必要がある（上表 #4 / #5）。
- 旧キーは Cloudflare **Secrets には存在しない**（非機密 `[vars]` 管理）。`bash scripts/cf.sh` での確認に
  留め、`secret put` / `secret delete` は行わない（index.md §5 スコープ外）。
- 挙動は不変（旧キーは `NEXT_PUBLIC_API_BASE_URL` と常に同値の重複行であり、base URL の値・解決優先順位は
  変えない）。再 deploy は重複 vars を消すための反映であって、値の付け替えではない。

## 5. PR 本文に反映する要素

- 目的: 同一 API base URL に対する 2 命名（`NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL`）併存の解消。
- 変更内容: apps/web から `PUBLIC_API_BASE_URL` / `getApiBaseEnv` / `ApiBaseEnv` を削除、apps/og で
  `NEXT_PUBLIC_API_BASE_URL` へ rename、spec 群 11 ファイルの seed/assert 移行。
- 検証: AC-7 grep gate 0 件 / typecheck / lint / targeted vitest green（`implementation-guide.md` §2.7 参照）。
- 視覚証跡: **UI/UX 変更なしのため Phase 11 スクリーンショット不要**（NON_VISUAL）。PR 本文にスクリーンショット
  セクションを設けない。
- 再 deploy 要否: wrangler vars 変更を本番反映するため staging → production 再 deploy が必要（本 Phase §4）。

## 6. ゲート

- **Gate-A（spec_review）**: passed（仕様書作成完了）。
- **Gate-B（implementation_review）**: passed（実コード・設定・spec・GitHub Actions env injection・aiworkflow 正本同期・ローカル検証完了）。
- **Gate-C（external_ops）**: pending（commit / push / PR / deploy / Issue mutation は user-gated）。
