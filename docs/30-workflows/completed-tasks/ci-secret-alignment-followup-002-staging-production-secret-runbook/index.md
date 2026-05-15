# Workflow: ci-secret-alignment-followup-002-staging-production-secret-runbook

> **[実装区分: implementation / NON_VISUAL / docs_plus_script_fix]**
>
> 初期判定は docs-only だったが、close-out review で既存 helper
> `scripts/smoke/provision-staging-secrets.sh` と既存 `secret-provisioning.md` に
> stale `gh secret set --body -` guidance が残っていることを検出した。
> 現行 `gh secret set --help` では `--body` 未指定時に stdin を読むため、
> CONST_009 に従いラベルより実態を優先し、同一サイクルで script / runbook を補正する。

## メタ情報

| key | value |
|-----|-------|
| workflow ID | `ci-secret-alignment-followup-002-staging-production-secret-runbook` |
| 親 workflow | `ci-secret-alignment-and-runtime-smoke-recovery`（既に `completed-tasks/` 配下） |
| 由来 Issue | [#662](https://github.com/daishiman/UBM-Hyogo/issues/662) `[CIPR-FU-002] staging / production Environment secret provisioning runbook`（CLOSED 2026-05-14T12:18:45Z） |
| 元 unassigned spec | `docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | n/a（docs-only） |
| 優先度 | 中 |
| 規模 | 小規模 |
| workflow_state | `completed` |
| 作成日 | 2026-05-14 |

## 背景

Issue #662 は CLOSED だが、対象成果物 `staging-secret-provisioning.md` / `production-secret-provisioning.md` 2 本は repo 内に **未作成**（`find docs -name "staging-secret-provisioning*"` ヒット 0 件）。親 workflow は `completed-tasks/` 配下に移動済だが、In-scope 「staging / production Environment 用 secret provisioning runbook」項目は未充足のまま残っている。本 workflow は close 済 Issue の対象成果物を canonical 化する補強タスクとして再起動する。

## スコープ（CONST_007 準拠）

本 workflow が生成する全 Phase は **後続実装プロンプト（03.実装.md）の 1 サイクル内で完了するスコープ**に収める。先送り・別 PR 化は行わない。

| 含む | 含まない |
|------|---------|
| `runbooks/staging-secret-provisioning.md` 新規作成 / `runbooks/production-secret-provisioning.md` 新規作成 / 親 `index.md` 整合確認 / 章立て一致 grep gate / 実値混入 grep gate / 既存 helper と既存 `staging-runtime-smoke` runbook の stale stdin guidance 補正 | 実 secret 値の記述・rotation 実施・workflow YAML 修正・`CLOUDFLARE_ACCOUNT_ID` 管理・GitHub secret mutation・commit・push・PR |

## 不変条件

1. 実 secret 値・API Token 値・OAuth トークン値・JWT 値を一切記述しない（grep gate で hex 32+ / `eyJ...` パターン検出 = FAIL）。
2. secret 取得元は `op://Vault/Item/Field` 参照のみで記述する。
3. 既存 `secret-provisioning.md`（`staging-runtime-smoke` 用）と同じ 7 章立て（目的 / 必要 secret 一覧 / 投入手順 / 投入確認 / 動作確認 / ローテーション運用 / 禁止事項）で揃える。
4. `staging-runtime-smoke` 用既存 runbook は原則として並立構成（3 ファイル）にする。既存 runbook 内の stale CLI guidance が close-out review で検出された場合のみ、実行事故防止のため同一サイクルで最小補正する。
5. `CLOUDFLARE_ACCOUNT_ID` は GitHub Variables 管理である旨を冒頭に明記し、Environment Secret 誤投入を防止する。
6. `apps/` / `packages/` の dirty diff を生まない。`scripts/` は stale helper correction のみ許容し、workflow YAML / app package は変更しない。

## 正本順位

1. 本 `index.md` および `phase-*.md`
2. 親 `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md` の In-scope 定義
3. 既存 `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`（章立て template）
4. `.github/workflows/web-cd.yml`（参照 workflow / secret 参照名）
5. `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

衝突時は上位を優先する。

## Phase 構成

| Phase | 目的 | 成果物 |
|-------|------|-------|
| 1 | 要件定義・スコープ確定 | `phase-1.md` |
| 2 | 既存資産インベントリ・参照経路解析 | `phase-2.md` |
| 3 | runbook 章立て・差分設計 | `phase-3.md` |
| 4 | Open Questions 解決 | `phase-4.md` |
| 5 | 実装ガイド（章ごとの文面方針） | `phase-5.md` |
| 6 | 検証手順設計（grep gate / 章立て一致） | `phase-6.md` |
| 7 | リスク・障害復旧 | `phase-7.md` |
| 8 | 運用・rotation 設計 | `phase-8.md` |
| 9 | DoD（完了条件） | `phase-9.md` |
| 10 | 参照情報・依存マトリクス | `phase-10.md` |
| 11 | Evidence 収集（grep gate 結果） | `phase-11.md` |
| 12 | コンプライアンスチェック・skill feedback | `phase-12.md` |
| 13 | commit / push / PR（ユーザー承認 gate） | `phase-13.md` |

## 同期対象（completed）

- 元 unassigned spec の status を `consumed_by_workflow` に更新
- 親 workflow `index.md` In-scope に runbook 2 本の参照を追記
- `.claude/skills/aiworkflow-requirements/references/` / `indexes/` に web-cd staging/production Environment Secret runbook の正本導線を追記
- `scripts/smoke/provision-staging-secrets.sh` と既存 `secret-provisioning.md` の stale `--body -` guidance を現行 `gh secret set` contract に同期

## 後続フェーズへの引き継ぎ

本実行サイクルで `staging-secret-provisioning.md` / `production-secret-provisioning.md` 2 本を作成し、Phase 6 の grep gate を Phase 11 evidence として保存済み。Issue は既に CLOSED のため再オープンせず、将来 PR 化する場合は本文に `Refs #662` を記載して履歴を紐付ける。
