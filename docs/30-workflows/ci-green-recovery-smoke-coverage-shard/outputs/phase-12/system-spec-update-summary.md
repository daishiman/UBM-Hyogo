# Phase 12 — System Spec Update Summary

> task: `ci-green-recovery-smoke-coverage-shard` / status: `implemented_local_evidence_captured`（implementation / NON_VISUAL / runtime_ci_pending）

## Step 1-A: 完了タスク記録

3 lane の CI 修復を実装した。コード・CI config・runbook 変更は本ワークツリーに反映済みで、ローカル検証は green。staging secret 投入と remote CI 観測は user-gated。

| Lane | 内容 | 新規/修正 |
|---|---|---|
| A | CI 実行時 mint 方式（`mintStagingBearers`）で短命 JWT を発行し runtime-smoke admin 401 を恒久解消。後方互換 fallback 維持 | 新規 helper + workflow/script 修正 |
| B | `coverage-gate` の step 順序入れ替え + MISSING 診断強化（誤検知解消） | ci.yml / coverage-guard.sh 修正 |
| C | `ci.yml` top-level `permissions: contents: read` + shard checkout token hardening | ci.yml 修正 |

## Step 1-B: 実装状況

| 項目 | 値 |
|---|---|
| `artifacts.json.status` | `implemented_local_evidence_captured` |
| `metadata.workflow_state` | `implemented_local_evidence_captured` |
| `metadata.implementation_status` | `implemented-local` |
| 実装の実行主体 | 本サイクルで実装済み。remote CI / secret 投入 / PR は user-gated |

実コード差分が存在するため、システム仕様反映は **implemented-local same-wave sync** として閉じる。production 認証契約は不変、smoke 運用契約は runbook と aiworkflow index を正本にする。

## Step 1-C: 関連タスク

| 関連 | パス | 関係 |
|---|---|---|
| 旧 500 recovery 教訓 | `docs/30-workflows/completed-tasks/task-runtime-smoke-admin-members-500-recovery-001/outputs/lessons-learned-auth-secret-true-cause.md` | AUTH_SECRET binding falsy の真因記録（本タスクは「binding は存在し token 失効が原因」と切り分け） |
| secret 投入 runbook | `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | mint secret 5 種 + 即時再発行手順を追記する対象 |
| CI 分割仕様 | `docs/30-workflows/completed-tasks/issue-617-ci-test-time-reduction-split/` | shard / aggregate coverage gate の設計正本（Lane B/C はこの設計を維持し step 順序のみ改善） |

## Step 2: 新規インターフェース反映要否判定

本タスクは新規インターフェース `mintStagingBearers`（CI 実行時の staging session JWT 発行）を追加する。システム仕様への反映要否を以下で判定する。

| 仕様ファイル | 反映要否 | 理由 |
|---|---|---|
| `docs/00-getting-started-manual/specs/02-auth.md` | **追記不要（任意）** | `signSessionJwt` / `verifySessionJwt` / session JWT TTL の正本は既に記載済み。`mintStagingBearers` は **既存 `signSessionJwt` を CI で再利用する smoke 専用 helper** であり、認証設計そのもの（claim 構造・検証ロジック・TTL 既定）を変更しない。production 認証 surface に影響しない |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | **追記不要（任意）** | MVP bearer / session 方針は不変。mint は test 用 bearer の供給方法のみで MVP 認証経路を変えない |

**判定結論**: `02-auth.md` / `13-mvp-auth.md` への **必須追記なし**。production 認証契約は不変で、`mintStagingBearers` は smoke インフラ層に閉じる。
ただし「staging smoke の bearer は CI 実行時 mint（`signSessionJwt` 再利用、TTL 600s）」という運用事実は **runbook（`secret-provisioning.md`）が正本**として記述する（spec ではなく runbook に置く）。production auth spec への back-link は必須ではない。

## same-wave sync（implemented-local）

| 対象 | 内容 |
|---|---|
| `.claude/skills/aiworkflow-requirements/` references / indexes | 本ワークフローの active entry / artifact inventory / quick-reference / resource-map / changelog / SKILL history を implemented-local 状態へ同期済み |
| root/output artifacts parity | `artifacts.json` と `outputs/artifacts.json` を同一内容で配置済み |
| runbook `secret-provisioning.md` | mint secret 5 種 + 即時再発行手順を追記済み（実 secret 投入はユーザー gated） |

## 結論

production 認証契約（02-auth / 13-mvp-auth）の正本変更は不要。`mintStagingBearers` は smoke インフラ層の helper として runbook を正本にする。implemented-local の実態に合わせ、aiworkflow の active ledger と artifact inventory で same-wave sync を閉じる。
