# Phase 1: 要件定義 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

CONST_004 適合根拠: 現サイクルは `implementation / NON_VISUAL / implemented-local` であり、`.github/workflows/runtime-smoke-staging.yml` 新設、`backend-ci.yml` reusable workflow call、`scripts/smoke/runtime-attendance-provider.sh` の `--out-dir` / `--ci-summary` 拡張、`scripts/smoke/ci-summary-post.sh` 新設、ADR 2 本作成、GitHub Environment `staging-runtime-smoke` 配置 runbook を伴う。GitHub Environment 作成、secret 配置、staging smoke 実行、Slack real post、commit / push / PR は user-gated の後続 runtime / PR cycle に分離する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-571-runtime-smoke-ci-staging-integration |
| phase | 1 / 13 |
| wave | 4 (CI/CD integration follow-up) |
| mode | sequential |
| 作成日 | 2026-05-08 |
| taskType | implementation（現 cycle） |
| visualEvidence | NON_VISUAL |
| issue | #571（CLOSED 維持） |

## 目的

issue-531 で確立した runtime smoke runner を **GitHub Actions が staging deploy 完了 trigger で自動実行**する経路を定義する。AC / 不変条件 / 自走禁止操作 / approval gate / evidence path / 用語を確定し、Phase 2（設計）以降が単独で進められる状態にする。

## 入力情報

- Issue #571 本文（5 件 AC 候補：staging deploy → 自動 smoke → PASS evidence artifact → grep gate 0 hit → required check 化 ADR）
- 親タスク `docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/index.md`
- `scripts/smoke/runtime-attendance-provider.sh` 実装（出力 path が hard-coded → CI 統合のため `--out-dir` 化が必要）
- `scripts/smoke/redact.sh` 実装（`Set-Cookie` / `authorization:` / `cf-*` をマスクする filter。base64 化 cookie 値の偽陰性可能性）
- `.github/workflows/web-cd.yml`（staging deploy trigger 候補）
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`（Slack incident webhook 規約）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（secret 配置正本）
- CLAUDE.md（`scripts/cf.sh` 必須 / `wrangler` 直接禁止 / 1Password 正本）

## 出力（Phase 1 確定アウトプット）

`outputs/phase-01/main.md` に以下を確定する:

1. AC-1〜AC-7 を observable evidence path と 1:1 対応
2. 不変条件マッピング（INV #5 / #14 / #16 / #17 + Environment-scoped secret 分離 INV）
3. 自走禁止操作リスト（実 GitHub Environment 作成 / 実 secret 配置 / workflow 配置 / smoke 発火 / Slack post / Issue 状態変更 / commit / push / PR）
4. approval gate G1〜G5 の発動条件
5. evidence path（CI workflow run log / artifact / Slack failure injection を分離）
6. 用語集（workflow_call / workflow_dispatch / GitHub Environment / Environment-scoped secret / `::add-mask::` / required status check / optional check / failure injection / redaction false-negative / base64 cookie）

## 実行タスク

1. **Issue 5 件 AC を observable に分解**: Issue #571 §3.3 で示された 5 件（deploy → 自動 smoke → PASS evidence artifact → grep gate 0 hit → required check 化 ADR）に、redaction 偽陰性対策（base64 cookie）と Environment-scoped secret 分離を追加し、AC-1〜AC-7 にする。完了条件: 各 AC に evidence path が 1:1 で対応。
2. **multi-stage approval gate 設計**: G1（GitHub Environment 配置承認）/ G2（workflow YAML レビュー承認）/ G3（staging deploy → 自動 smoke 初回成功承認）/ G4（failure injection 実測承認）/ G5（30 日連続 PASS 後の required 昇格判断承認、別サイクル）。完了条件: 各 gate の前提・通過記録 path・自走禁止操作が明示。
3. **trigger 戦略の優先度確定**: 第一案 `workflow_call`（`backend-ci.yml` の API staging deploy 成功後に同一 ref で呼び出す）、第二案 `workflow_dispatch`（debug）。`repository_dispatch` は default branch workflow 定義・token permission・同一 SHA checkout の制約があるため不採用。
4. **secret 注入経路 ADR 骨子の確定**: 3 案（GitHub Environments / 1Password connect / OIDC short-lived）を評価軸（コスト・rotate 容易性・無料枠・誤発火リスク・既存運用整合）で比較。本サイクル採用案は **GitHub Environments + Environment-scoped secret**。1Password connect は将来選択肢として残置、OIDC short-lived は production 拡張時に再評価。
5. **redaction 偽陰性対策**: 既存 `scripts/smoke/redact.sh` は文字列マッチのみのため、base64 化 cookie 値（`Cookie: <base64>` の base64 部分）が hit しない可能性を AC-3 として明示。`scripts/smoke/__tests__/redact.test.sh` を新設し、`base64 -d` 後の文字列が含まれない（= 元 plain cookie が leak していない）ことを fixture で assert。
6. **`::add-mask::` × `set -x` 事故再発防止策の確定**: `runtime-attendance-provider.sh` 内で `set -x` を使わない（`set -euo pipefail` のみ）。CI workflow YAML 側でも `set -x` / `bash -x` を使わない。grep gate `! grep -rn "set -x" scripts/smoke/ .github/workflows/runtime-smoke-staging.yml`。Issue 苦戦箇所を AC-7 として固定。
7. **自走禁止操作の確定**: 実 GitHub Environment / Secret 作成、workflow 配置、smoke 発火、Slack post、Issue 状態変更、commit、push、PR 作成、`wrangler` 直接実行、Issue #571 の reopen を gate 化。完了条件: 7 項目以上が列挙される。

## 制約事項

- Issue #571 は **CLOSED 状態を維持**する。仕様書作成・後続実装でも reopen しない（ユーザー指示）
- secret 値（Bearer / cookie / webhook URL / Sentry DSN）を repo / docs / log / PR body / artifact / Slack post に書かない（INV #16）
- GitHub Actions 無料枠維持（INV #14 派生）。月次実行回数を見積もり、staging deploy 頻度 × 1 smoke run + failure 時の再実行で free tier 内に収まる前提を Phase 2 で再確認
- 実 GitHub Environment 作成、secret 配置、staging smoke 実行、Slack real post、commit / push / PR は user approval 後のみ
- secret 投入は `bash scripts/cf.sh secret put` の対象外（GitHub Secrets は `gh secret set` 経由。実 set は本サイクル外）
- 既存 `scripts/smoke/runtime-attendance-provider.sh` の hard-coded out path（`docs/30-workflows/issue-531-...`）は CI 統合のため Phase 5 で `--out-dir` 化する。互換性のため引数省略時は既存 path を維持

## 検証コマンド（要件確定の確認）

```bash
# 参照資料が存在
test -f scripts/smoke/runtime-attendance-provider.sh
test -f scripts/smoke/redact.sh
test -f .github/workflows/web-cd.yml
test -d docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration

# Phase 1 output が AC / gate / evidence path / 用語集を含む
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
grep -q "AC-1\|AC-7" "$SPEC_DIR/outputs/phase-01/main.md"
grep -q "G1\|G5" "$SPEC_DIR/outputs/phase-01/main.md"
grep -q "workflow_call\|workflow_dispatch" "$SPEC_DIR/outputs/phase-01/main.md"
grep -q "Environment-scoped\|::add-mask::" "$SPEC_DIR/outputs/phase-01/main.md"

# 仕様書に実 secret 値が混入していない（grep gate prefigure）
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-|Bearer [A-Za-z0-9_-]{20,}' "$SPEC_DIR/"

# Issue #571 が CLOSED のまま
gh issue view 571 --repo daishiman/UBM-Hyogo --json state | grep -q '"CLOSED"'
```

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/30-workflows/completed-tasks/issue-531-runtime-smoke-attendance-provider-migration/index.md`
- `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/artifacts.json`

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

- 本 phase は仕様確定のみ。実 workflow run / 実 secret 配置はしない
- 後続 runtime wave で Phase 11 evidence contract に従い、`workflow-run-summary.md` / `artifact-redaction-grep.log` / `slack-failure-injection.md` を取得する

## 完了条件（DoD）

- [ ] AC-1〜AC-7 が observable evidence path と 1:1 対応
- [ ] G1〜G5 の発動条件と通過記録 path が明示
- [ ] 自走禁止操作リスト最低 7 項目（Environment 作成 / Secret 配置 / workflow 配置 / smoke 発火 / Slack post / Issue 状態変更 / commit-push-PR / wrangler 直接 / Issue reopen）
- [ ] 用語集に最低 8 語（workflow_call / workflow_dispatch / GitHub Environment / Environment-scoped secret / `::add-mask::` / required status check / optional check / failure injection）が定義
- [ ] Issue #571 が CLOSED のまま据え置き（reopen していない）
- [ ] 実 secret 値が含まれていない（grep gate PASS）

## タスク 100% 実行確認

- [ ] 必須セクションが全て埋まっている
- [ ] 完了済み issue-531 本体の復活ではなく CI 統合 follow-up である旨を明示
- [ ] 実装、deploy、commit、push、PR、Issue 状態変更を実行していない

## 次 Phase への引き渡し

Phase 2 へ:
- 確定 AC-1〜AC-7 と evidence path
- G1〜G5 gate 一覧
- trigger 第一案（`workflow_call`）/ debug 経路（`workflow_dispatch`）
- ADR 2 本（secret 注入経路 / required check 昇格判断）の骨子
- 自走禁止操作リスト
- 用語集
