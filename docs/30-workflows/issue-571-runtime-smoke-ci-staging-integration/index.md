# issue-571-runtime-smoke-ci-staging-integration — タスク仕様書 index

[実装区分: 実装仕様書]

CONST_004 適合根拠: 本タスクは GitHub Actions workflow（`.github/workflows/runtime-smoke-staging.yml`）の新設、`scripts/smoke/` 系スクリプトの CI 受け入れ整備、ADR 2 件（secret 注入経路 / required status check 昇格判断）の新規策定、failure 時 Slack post helper 追加（任意）を伴うため、コード変更を必要とする実装仕様書として作成する。Issue #571 は **state: CLOSED のまま** spec を作成し、後続実行サイクルで本仕様書を起点に Issue を再オープンせず PR 経由で完了させる（クローズ維持指示）。

## current cycle boundary

本ブランチの現在サイクルは **implemented-local cycle** であり、Phase 1〜13 の実行ランブック、実 workflow / script / ADR / runbook、local PASS 5 点、Phase 12 strict 7 outputs を同一サイクルで揃える。GitHub Environment 作成、secret 配置、staging smoke 発火、Slack real post、commit / push / PR は user approval 後の runtime / PR cycle でのみ実行する。

| Cycle | 実行すること | 実行しないこと | 完了状態 |
| --- | --- | --- | --- |
| implementation（本サイクル） | 仕様書、Phase outputs、Phase 12 strict 7 files、workflow / script / ADR / runbook 実ファイル実装、local PASS 5 点、aiworkflow 正本同期 | GitHub Environment / secret 配置、staging deploy、Slack real post、commit / push / PR | `implemented-local` |
| runtime evidence（後続） | G1-G4 承認後の staging deploy smoke、artifact grep、failure injection | production smoke / required check 昇格 | `PASS_RUNTIME_VERIFIED` |
| observation（後続） | 30 日 PASS 観測、required 昇格判断 | 30 日未満での required 化 | `promotion-ready` |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | attendanceProvider runtime smoke の CI (GitHub Actions) 自動実行統合 |
| タスクID | task-doc-issue-571-runtime-smoke-ci-staging-integration-001 |
| ディレクトリ | docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration |
| Issue | #571（state: CLOSED — closed のまま spec を作成） |
| 親タスク | issue-531-runtime-smoke-attendance-provider-migration（completed-tasks 配下） |
| 上位コンテキスト | issue-371 attendanceProvider middleware DI 移行 |
| Wave | 4 (CI/CD integration follow-up) |
| 実行種別 | sequential（workflow 設計 → ADR 確定 → secret 配置 → workflow 配置 → smoke 自動実行 → required check 昇格判断 の順序固定） |
| 作成日 | 2026-05-08 |
| 担当 | spec drafted on this branch（docs/issue-571-runtime-smoke-ci-integration） |
| 状態 | implemented-local |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | priority:medium |
| 規模 | scale:small |
| 発見元 | issue-531 Phase 12 unassigned-task-detection（"CI integration for runtime smoke / no-op now" として deferred） |

## purpose

`issue-531-runtime-smoke-attendance-provider-migration` で整備した `scripts/smoke/runtime-attendance-provider.sh` を **staging deploy 完了 trigger で GitHub Actions が自動実行**し、attendanceProvider middleware DI 移行の runtime contract を回帰検出可能にする。具体的には:

- `.github/workflows/runtime-smoke-staging.yml` を新設し、`backend-ci.yml` の API staging deploy 完了後に reusable workflow (`workflow_call`) で smoke を発火する
- secret 注入経路は **GitHub Environments / 1Password connect / OIDC short-lived の 3 案を ADR 化**し、本サイクルでは GitHub Environments + reusable workflow を採用
- artifact は **summary-only**（status / jq contract / count）。raw body / cookie / Bearer / Set-Cookie を含まない（既存 `scripts/smoke/redact.sh` と整合）
- failure 時のみ Slack incident webhook へ **redact 済み summary** を post（成功時は post しない＝ noisy 化抑制）
- required status check への昇格判断は ADR 化し、本サイクルでは optional check（required にしない）。30 日連続 PASS で required 昇格を再評価

## why this is not a restored old task

issue-531 本体は staging への smoke runner 配置と evidence redactor までを scope とし、CI 統合は明示的に scope out（"CI integration for runtime smoke / no-op now"）として deferred した。本タスクはその follow-up であり、issue-531 で確立した evidence 規約（summary-only / redaction / canonical path）を CI 上で再現する点に責務を限定する。`apps/api/src` のロジック変更は伴わない。

## scope in / out

### Scope In

- `.github/workflows/runtime-smoke-staging.yml` を新設（trigger: `workflow_call` + debug `workflow_dispatch`）
- `apps/api` の staging deploy workflow（`backend-ci.yml`）に **runtime-smoke-staging reusable workflow call** を追記（API deploy 完了後に同一 ref で実行）
- `scripts/smoke/runtime-attendance-provider.sh` の **CI mode 対応**（出力 evidence パスを `--out-dir` で受け、CI 環境では artifact upload 用 tmp 領域に書き出し可能にする最小拡張）
- `scripts/smoke/ci-summary-post.sh` を新設（failure 時 Slack incident webhook に redact 済み summary を post。webhook URL は GitHub Secrets / 1Password 経由のみ）
- ADR 2 本を新規策定:
  - `docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md`（GitHub Environments / 1Password connect / OIDC short-lived の 3 案比較・採用案・rollback 条件）
  - `docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md`（required 昇格条件・30 日連続 PASS gate・偽陽性 escape valve）
- GitHub Environment `staging-runtime-smoke` の作成手順 runbook（`docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/operations/setup-github-environment.md`）
- Phase 11 NON_VISUAL evidence: workflow run log / artifact summary / redaction grep gate / Slack post 実測（failure injection 時のみ）
- 親タスク（issue-531）`workflow_state` 維持（本タスク完了時点で issue-531 は `completed` のまま据え置き、CI 自動実行 PASS は本タスクの `workflow_state` 配下で管理）

### Scope Out

- production 環境への smoke 自動実行（別 Issue 候補として本タスクに記録するが、起票・着手は staging runtime smoke の 30 日観測後。理由: 無料枠枯渇と偽陽性率を staging で先に測るため）
- `apps/api/src/middleware/repository-providers.ts` / `apps/api/src/repository/_shared/builder.ts` の改修（issue-371 / issue-531 で完了済み）
- 新規 endpoint / D1 schema / Google Form schema 変更
- e2e（Playwright）テスト基盤との統合（curl ベース NON_VISUAL evidence で十分）
- `scripts/smoke/runtime-attendance-provider.sh` 本体の smoke 対象 route 拡張（issue-531 で凍結。CI 統合のみが本タスクの責務）
- Sentry / Slack の有償プラン契約・新規 channel 作成（既存 `#incident` webhook を流用）

## dependencies

### Depends On

- Issue #531 本体（runtime smoke runner / redactor / evidence canonical path 規約）
- 既存 `apps/api` staging deploy workflow（`backend-ci.yml` の `deploy-staging` が trigger 起点）
- 1Password 正本（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT`）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」「シークレット管理」
- GitHub Environments 機能（無料プランで `protection rules` を含めて利用可能）

### Blocks

- production runtime smoke の CI 自動実行 Issue（staging 30 日観測後に起票・着手）
- 09c production deploy readiness（runtime regression 検出の自動化が前提）
- required status check 昇格判断（30 日連続 PASS evidence 必要）

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/ | 親タスク（runner / redactor / evidence 契約） |
| 必須 | scripts/smoke/runtime-attendance-provider.sh | CI から呼び出される smoke runner |
| 必須 | scripts/smoke/redact.sh | Cookie / authorization / cf-* token redaction filter |
| 必須 | .github/workflows/web-cd.yml | staging deploy trigger 起点候補 |
| 必須 | .github/workflows/backend-ci.yml | 既存 CI 規約（lint / typecheck step 整合） |
| 必須 | apps/api/wrangler.toml | staging env 名整合 |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | Bearer / session cookie 認証契約 |
| 参考 | CLAUDE.md | scripts/cf.sh 必須・wrangler 直接禁止・1Password 参照のみ |
| 参考 | .claude/skills/aiworkflow-requirements/references/observability-monitoring.md | Slack incident webhook 規約 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret 配置正本 |
| 参考 | .claude/skills/task-specification-creator/references/phase-templates.md | Phase 1-13 テンプレ |
| 参考 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 6 タスク |

## AC（受入条件）

- AC-1: `.github/workflows/runtime-smoke-staging.yml` が存在し、`workflow_call`（`backend-ci.yml` から呼び出し）または `workflow_dispatch` で smoke を発火できる（手動 trigger は debug 用に必須）
- AC-2: staging deploy 完了 → smoke 自動実行 → PASS evidence artifact upload（保持期間 30 日）の経路が **1 度の deploy で end-to-end PASS** する
- AC-3: artifact / workflow log / Slack post に **secret 実値が含まれない**（grep gate `Cookie:|authorization:|Bearer [A-Za-z0-9]|hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-` が 0 hit）。base64 化 cookie 値の偽陰性に対しては redact filter テストケース（`scripts/smoke/__tests__/redact.test.sh` 等）を追加し、`base64 -d` 後の文字列が含まれないことを assert
- AC-4: failure 時のみ Slack `#incident` 相当 webhook に redact 済み summary が 1 通 post される。成功時は post 0 通
- AC-5: ADR 2 本（secret 注入経路 / required status check 昇格判断）が `docs/40-architecture/adr/` に配置され、本サイクルでは required check に昇格させない（optional check）旨が明記される
- AC-6: GitHub Environment `staging-runtime-smoke` が secret scope を持ち、`production` Environment と secret が混在しない（Environment-scoped secret のみ参照、repository-scoped secret に staging credential を置かない）
- AC-7: `::add-mask::` 宣言と `set -x` の相互作用（secret leak 事故）が、smoke runner / CI workflow 双方で **再発しないこと**が grep gate と test fixture で保証される

## invariants touched

- INV #5 D1 直接アクセスは `apps/api` に閉じる（本タスクでは触れない）
- INV #14 Cloudflare 無料枠維持（GitHub Actions 無料枠でも完結）
- INV #16 secret 値を docs / log / PR / artifact に書かない
- INV #17 incident response readiness（Slack incident webhook 経由の通知）
- INV: GitHub Environment-scoped secret と repository-scoped secret の分離（cross-env 流入禁止）

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計（trigger / secret 注入 / ADR 骨子）
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 実測 evidence（CI workflow run log / artifact / Slack failure injection）
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log（local PASS 5 点セット）
- outputs/phase-11/evidence/actionlint.log（workflow YAML lint）
- outputs/phase-11/evidence/workflow-run-summary.md（CI run log summary）
- outputs/phase-11/evidence/artifact-redaction-grep.log（artifact redaction PASS log）
- outputs/phase-11/evidence/slack-failure-injection.md（failure 注入時の Slack post 実測 redact 済み summary）
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## completion definition

現サイクルでは、全 phase 仕様書、Phase 12 strict 7 files、`.github/workflows/runtime-smoke-staging.yml`、`backend-ci.yml` reusable workflow call、smoke runner の `--out-dir` / `--ci-summary`、Slack failure summary helper、ADR 2 本、GitHub Environment 配置 runbook、local PASS 5 点、redaction 偽陰性対策（base64 cookie 検出）、`::add-mask::` × `set -x` 事故再発防止策が確定していること。

本実装サイクルでは:
- ✅ 仕様書ファイル / outputs ディレクトリ作成
- ✅ `.github/workflows/runtime-smoke-staging.yml` の実装
- ✅ `.github/workflows/backend-ci.yml` の reusable workflow call 実装
- ✅ `scripts/smoke/` の CI 対応と shell tests 追加
- ✅ ADR 本文 2 件と Environment setup runbook 作成
- ❌ GitHub Environment 作成・secret 配置
- ❌ staging smoke / Slack real post
- ❌ commit / push / PR 作成
- ❌ Issue #571 の reopen / status 変更（CLOSED 維持）

## 自走禁止操作リスト

1. GitHub Environment / Secret の実 API 経由作成（ユーザー承認必須）
2. staging Worker への deploy / smoke の本サイクル内発火
3. Slack incident webhook への real post
4. Issue #571 の reopen / 状態変更（**CLOSED 維持**）
5. commit / push / PR 作成
6. `wrangler` 直接実行（必ず `bash scripts/cf.sh`）
7. 本仕様書作成サイクル内での commit / push / PR 作成
