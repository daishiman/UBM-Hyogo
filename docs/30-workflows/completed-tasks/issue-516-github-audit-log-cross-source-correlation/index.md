# タスク仕様書: Issue #516 — GitHub Actions audit log との cross-source 相関

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-516-github-audit-log-cross-source-correlation |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/516 (OPEN) |
| 起票元 source | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md` |
| 親タスク | `U-FIX-CF-ACCT-01-DERIV-04-FU-04` |
| 親ワークフロー | `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| 配置先 | `docs/30-workflows/issue-516-github-audit-log-cross-source-correlation/` |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local |
| workflow_state | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — root cause: 「GitHub Actions audit log 取得 + redact-safe correlation key + Cloudflare audit との timeline merge + fixture 駆動 grep gate」を達成するには、`apps/api/src/audit-correlation/`、`scripts/audit-correlation/`、`.github/workflows/audit-correlation-verify.yml` 配下のコード変更が不可欠。docs-only では grep gate / fixture テスト / fingerprint hash 計算ロジックを実体化できないため。 |
| 親 Issue 状態維持 | **現状維持（OPEN のまま据え置き）**。本仕様書での再オープン / クローズ操作は行わない。Phase 13 の PR merge 後にユーザー判断でクローズする想定。 |
| 優先度 | 中（`priority:medium`） |
| 規模 | 中規模 |
| 想定 PR 数 | 1（apps/api 実装 + scripts + workflow + runbook + SSOT 同期） |
| coverage AC | `apps/api/src/audit-correlation/` の focused vitest が green、`scripts/audit-correlation/` は bats / shellcheck clean、`.github/workflows/audit-correlation-verify.yml` は actionlint clean、grep gate（secret / full IP / full email / user agent / salt literal 非保存）が CI で恒久化 |

## GitHub label / tag（Claude Code / Codex 共有用）

このタスクの仕様書を Claude Code / Codex に渡してコード実装 → PR 作成を依頼する際は、必ず以下の label / コンテキストを併送すること。`artifacts.json` の `claudeCodeContext` セクションが正本。

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#516` (`Refs: #516` を PR 本文に必ず含める) |
| GitHub Issue labels（継承） | `priority:medium`, `type:security` |
| PR に付与する labels | `priority:medium`, `type:security` |
| `gh pr create` 引数 | `--label priority:medium --label type:security` |
| ブランチ名 | `feat/issue-516-github-audit-log-cross-source-correlation` |
| PR タイトル | `feat(security): issue-516 GitHub Actions audit log との cross-source 相関基盤` |
| 親タスク参照 | `U-FIX-CF-ACCT-01-DERIV-04-FU-04` |

> **Claude Code / Codex 実行ガイド**: 仕様書を実行する際は、上記 label / context を Phase 13 の PR 作成プロンプトに必ず引き渡すこと。CLAUDE.md「PR 作成の完全自律フロー」と整合する。

## 目的

Cloudflare Audit Logs（Issue #408 で監視中）と GitHub Actions audit log を cross-source で相関させ、HIGH severity な不正ログイン / token rotation 事象を「単一 incident」として timeline merge することで以下を実現する:

1. **redact-safe join key の確立**: actor email がある場合は email identity、無い場合は network fallback を SHA-256 + per-environment salt で hash 化した `fingerprintHash` を定義し、両ソースに横串を通す。
2. **PII 非保存原則の維持**: secret / full IP / 完全 user agent 文字列を D1 / log / evidence のいずれにも残さない（grep gate で CI 恒久化）。
3. **incident runbook 統合**: HIGH alert 発生時に「Cloudflare 側 finding → GitHub 側 finding を fingerprintHash で join → 時系列 merge → severity 評価 → on-call 連絡」の dry-run runbook を整備。
4. **fixture 駆動 verify**: synthetic な GitHub workflow event と Cloudflare audit event の fixture を CI で恒久実行し、correlation engine の決定論性を担保。

親タスクで「actor_email / actor_ip を redact した結果、cross-source correlation join key を失った」手戻りが発生したため、Phase 1 で「join key として何を redact-safe な形で保持するか」を最優先で確定する。

## スコープ

### 含む

- `apps/api/src/audit-correlation/` 配下に GitHub audit fetch クライアント / fingerprint hash 計算 / correlation engine / type 定義を新規実装。
- `scripts/audit-correlation/` 配下に fixture loader / correlation runner / runbook dry-run wrapper を新規実装。
- `scripts/audit-correlation/fixtures/` 配下に synthetic GitHub / Cloudflare audit event の JSON fixture を配置。
- `.github/workflows/audit-correlation-verify.yml` を新規作成し、fixture テスト + grep gate を CI で恒久化。
- `docs/runbooks/audit-correlation.md` を新規作成し、HIGH alert 発生時の dry-run 手順を整備。
- `.claude/skills/aiworkflow-requirements/references/audit-correlation.md`（新規）に SSOT 反映し、`indexes/quick-reference.md` / `indexes/resource-map.md` / `indexes/topic-map.md` / `keywords.json` に追加。
- redaction policy 文書（fingerprint hash 仕様 / salt 管理 / per-environment 設計）を Phase 1-3 で確定し、コードコメントへ反映。

### 含まない

- Issue #408 本体（Cloudflare hourly monitor の初期 green 化）の実装。本タスクは Issue #408 完了後の cross-source 拡張に限定。
- GitHub Org Owner 権限の即時取得（前提条件 / 入手経路は Phase 1 の着手前提で扱うのみ）。
- 本番 GitHub audit log への live 接続（本タスクは fixture 駆動 verify までで完結。live wiring は後続 follow-up）。
- Slack / メール通知の自動配信（runbook 上の手順記述のみ）。
- Cloudflare 側 redaction ロジックの再設計（親 Issue #408 の責務）。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #408（Cloudflare audit logs monitoring） | Cloudflare 側 finding の正規化済みデータ構造が前提。current canonical root は `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| 上流 | GitHub Org Owner 権限 / `audit_log` scope の PAT | `/orgs/{org}/audit-log` API 取得に必須 |
| 下流 | incident runbook 統合（`docs/runbooks/audit-correlation.md`） | HIGH alert 時の対応手順 |
| 下流 | aiworkflow-requirements `audit-correlation` reference | SSOT 反映先 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が使用可能 | `mise exec -- node -v && mise exec -- pnpm -v` |
| Issue #408 の Cloudflare 側 finding スキーマが参照可能 | `test -f docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/index.md`（不在時は Phase 1 で fallback 仕様を確定） |
| `actionlint` / `shellcheck` / `bats` が利用可能（fallback 可） | `which actionlint shellcheck bats` |

## 想定アーキテクチャ概要（変更対象モジュール一覧）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/audit-correlation/types.ts` | 新規 | `GitHubAuditEvent` / `CloudflareAuditEvent` / `CorrelatedFinding` / `CorrelationKey` / `FingerprintHash` 型 |
| `apps/api/src/audit-correlation/github-fetch.ts` | 新規 | GitHub `/orgs/{org}/audit-log` クライアント（pagination / rate limit handling） |
| `apps/api/src/audit-correlation/redact.ts` | 新規 | actor_email / actor_ip / user_agent redaction + fingerprint hash 計算 |
| `apps/api/src/audit-correlation/correlate.ts` | 新規 | 両ソースの finding を fingerprintHash で join + 時系列 merge |
| `apps/api/src/audit-correlation/index.ts` | 新規 | barrel export |
| `apps/api/src/audit-correlation/__tests__/*.test.ts` | 新規 | vitest 単体 / 契約テスト |
| `scripts/audit-correlation/run.sh` | 新規 | fixture を読み correlation engine を起動するローカル runner |
| `scripts/audit-correlation/fixtures/github-*.json` | 新規 | synthetic GitHub audit event |
| `scripts/audit-correlation/fixtures/cloudflare-*.json` | 新規 | synthetic Cloudflare audit event |
| `scripts/audit-correlation/__tests__/*.bats` | 新規 | bats: grep gate / fixture 決定論性 |
| `.github/workflows/audit-correlation-verify.yml` | 新規 | CI 恒久化（fixture テスト + grep gate） |
| `docs/runbooks/audit-correlation.md` | 新規 | HIGH alert 時の dry-run runbook |
| `.claude/skills/aiworkflow-requirements/references/audit-correlation.md` | 新規 | SSOT |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 新 reference を index 追加 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / redact-safe join key SSOT 確定 / GO 判定 | completed |
| [2](phase-02.md) | アーキテクチャ設計 / モジュール配置 / データフロー | completed |
| [3](phase-03.md) | 詳細設計 / インタフェース契約 / 型定義 | completed |
| [4](phase-04.md) | テストファースト / 契約テスト設計 | completed |
| [5](phase-05.md) | コア実装（fetch / redact / correlate） | completed |
| [6](phase-06.md) | CLI / runbook 統合 | completed |
| [7](phase-07.md) | CI/CD 統合（`audit-correlation-verify.yml`） | completed |
| [8](phase-08.md) | governance / NON_VISUAL secret hygiene | completed |
| [9](phase-09.md) | デプロイ準備 / env / 1Password 参照 | completed |
| [10](phase-10.md) | ローカル / staging 検証 / dry-run | completed |
| [11](phase-11.md) | NON_VISUAL evidence 収集 | completed |
| [12](phase-12.md) | implementation guide / SSOT sync / changelog 等 6 タスク | completed |
| [13](phase-13.md) | PR 作成（multi-stage approval gate） | blocked_pending_user_approval |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | `outputs/phase-1/phase-1.md` |
| 2 | `outputs/phase-2/phase-2.md` |
| 3 | `outputs/phase-3/phase-3.md` |
| 4 | `outputs/phase-4/phase-4.md` |
| 5 | `outputs/phase-5/phase-5.md` |
| 6 | `outputs/phase-6/phase-6.md` |
| 7 | `outputs/phase-7/phase-7.md` |
| 8 | `outputs/phase-8/phase-8.md` |
| 9 | `outputs/phase-9/phase-9.md` |
| 10 | `outputs/phase-10/phase-10.md` |
| 11 | `outputs/phase-11/main.md` |
| 12 | `outputs/phase-12/main.md` |
| 13 | `outputs/phase-13/phase-13.md` |

## 完了条件（DoD: タスク全体）

- [x] `apps/api/src/audit-correlation/` の型定義 / fetch / redact / correlate が実装され、vitest が緑。
- [x] `scripts/audit-correlation/run.sh` が fixture を読み correlation 結果を JSON 出力する（決定論的、CI/Linux 側で verify）。
- [x] `.github/workflows/audit-correlation-verify.yml` が grep gate（secret / full IP / full UA / full email / salt literal 非保存）を恒久実行。
- [x] `docs/runbooks/audit-correlation.md` が HIGH alert 時の dry-run 手順を網羅。
- [x] aiworkflow-requirements に `audit-correlation.md` reference が追加され、`indexes/keywords.json` に登録。
- [ ] PR に `priority:medium` / `type:security` label が付与され、本文に `Refs: #516` を含む。
- [ ] CONST_007 整合: 全 13 Phase が後続実装プロンプトの 1 サイクル内で完了するスコープに収まっている。

## 参照情報

- 起票元: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-github-audit-merge.md`
- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/516
- 関連 Issue: https://github.com/daishiman/UBM-Hyogo/issues/408（上流）
- GitHub API: `/orgs/{org}/audit-log` (REST v3)
- 類似実装フォーマット: `docs/30-workflows/issue-348-09c-github-release-tag-automation/`
