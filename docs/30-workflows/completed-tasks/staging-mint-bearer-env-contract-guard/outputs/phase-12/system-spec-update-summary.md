# System Spec Update Summary — staging-mint-bearer-env-contract-guard

## Step 1: 本タスクで触れた docs / skill

### Step 1-A: 完了記録（タスク記録）

- 本タスク root（`docs/30-workflows/completed-tasks/staging-mint-bearer-env-contract-guard/`）を新規作成し、Phase 1-13 実装仕様書一式（index.md / phase-1..13 / phase-12 strict 7 / artifacts.json）と実コード実装を `implemented_local_evidence_captured` として記録。
- 起点は CI 失敗ログ（backend-ci → deploy-staging → runtime-smoke-staging.yml の `bulk-tag-runtime-smoke` job が `mint-staging-bearers: missing env: STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL` で exit 2）。関連 issue は無し（ログ起点）。
- 親タスク `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（bulk-tag runtime smoke 基盤）の mint env 契約欠陥を修正する follow-up として位置付け。
- 消費した未タスク: なし（baseline の issue #916 secret 投入タスクは境界分離・本サイクルで消費しない）。

### Step 1-B: 実装状況テーブル（implemented_local_evidence_captured）

| 項目 | 状態 |
| ---- | ---- |
| 仕様書 | Phase 1-13 作成完了 / `workflow_state=implemented_local_evidence_captured` |
| 実装コード（mint role-scoping / drift gate / provision 更新 / degrade / workflow） | **完了**（Gate-B passed） |
| focused test 実行 / actionlint / shellcheck / typecheck / lint | **実行済み**（focused Vitest 27 PASS / verifier PASS / bash -n/shellcheck PASS / actionlint PASS / typecheck・lint 実行） |
| runtime 検証（staging real D1 実走） | pending（user-gated・index.md §2 スコープ外） |
| commit / push / PR | pending（Gate-C / user-gated・Phase 13） |
| required status check 登録 | pending（user 明示承認必須・gating） |

### Step 1-C: 関連タスクテーブル

| 関連 | 関係 / ステータス |
| ---- | ----------------- |
| `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（親） | bulk-tag runtime smoke 基盤。本タスクはその mint env 契約 drift を修正する follow-up。基盤実装は変更しない |
| `unassigned-task/runtime-smoke-staging-mint-recurrence-fix-followup-001-staging-auth-secret-provisioning-mint-activation.md`（issue #916） | `STAGING_AUTH_SECRET` 投入と mint path 有効化（infra-ops 実行タスク・未実施）。本タスク（契約 drift gate の実装仕様化）とは関心分離。本サイクルで消費・変更しない（baseline 記録） |
| `.github/workflows/verify-hook-integrity.yml`（既存 gate） | 新規 `verify-mint-env-contract.yml` の構造踏襲元。変更しない |
| 既存 runtime smoke（`runtime-attendance-provider.sh` / `smoke` job） | 別関心。`smoke` job は無改修（既定 admin,me で後方互換維持） |

## Step 2: aiworkflow-requirements 正本更新

判定: **N/A（ドメイン正本インターフェースの新規追加なし）**。

理由: 本タスクは CI workflow / Node script（mint script・drift gate）/ shell（provision script）のみを対象とする CI-gate 改修であり、aiworkflow-requirements が正本管理するドメイン契約（API endpoint schema / D1 schema / IPC・preload bridge / UI route / auth 設計 / Cloudflare Secret 正本）の新規インターフェースを追加しない。

| ドメイン正本 | 本タスクの影響 | 判定 |
| ------------ | -------------- | ---- |
| API endpoint schema | endpoint の追加・request/response shape 変更なし（mint script は JWT を生成するだけ） | 影響なし |
| D1 schema | `ALTER` / migration / index 追加なし。本タスクは DB に触れない | 影響なし |
| IPC / preload bridge | 該当なし（CLI / CI shell。Electron IPC 層なし） | 影響なし |
| UI route | UI route 追加・変更なし（NON_VISUAL） | 影響なし |
| auth 設計 | 既存 `signSessionJwt` / `verifySessionJwt`（HS256）を再利用。認証境界・token 方式の変更なし | 影響なし |
| Cloudflare Secret 正本 | 既存 staging secret（`STAGING_AUTH_SECRET` / `STAGING_ADMIN_*` / `STAGING_ME_*`）を再利用。新規 secret の正本登録なし（provision script の参照キー整合のみ） | 影響なし |

> ただし mint script の**新 env 入力（`MINT_ROLES` / `RUNTIME_SMOKE_MINT_DEGRADE`）と新 CLI 契約（`--roles`）**は CI/script 層の派生物として導入される。これらはドメイン契約ではないため Step 2 = N/A だが、再現性のため `documentation-changelog.md` に新 env / 新 CLI 契約として記録する。skill 本体（`.claude/skills/**`）のファイルは増減しないため `.claude` 正本 / `.agents` mirror parity は自明にクリーン（symlink mirror・差分なし）。
