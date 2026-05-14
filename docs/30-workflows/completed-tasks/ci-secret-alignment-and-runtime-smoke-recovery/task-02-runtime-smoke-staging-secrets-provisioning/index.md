# task-02 — staging-runtime-smoke env の readiness gate と secret provisioning runbook（実装仕様書）

| 項目 | 値 |
|------|----|
| workflow id | `ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning` |
| 親ワークフロー | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`（spec / 設計の正本） |
| 実装区分 | **実装仕様書** |
| base branch | `dev` |
| feature branch（想定） | `fix/runtime-smoke-staging-readiness-gate` |
| 起票日 | 2026-05-09 |
| CONST_007 | single cycle |
| 適用 tier | NON_VISUAL（CI workflow / runbook 編集） |
| 正本 | 本ディレクトリ + 親 `index.md` / `outputs/phase-{1,2,3}/phase-{1,2,3}.md` |

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | n/a（CI yml + docs 編集） |
| workflow_state | implemented-local-runtime-pending |
| evidence_state | runtime_pending |
| implementation_mode | edit + new |

---

## 目的

`backend-ci / runtime smoke staging / smoke`（run #374）が `STAGING_API_BASE: STAGING_API_BASE is required` で exit 1。原因は GitHub Environment `staging-runtime-smoke` に必要な secret が 1 件も登録されていないこと。

本 task では (a) `.github/workflows/runtime-smoke-staging.yml` に readiness pre-check step を追加し、不足時に runner ログへ不足 secret 名を列挙する形で**早期 fail**させる。(b) 投入手順を `runbooks/secret-provisioning.md` として固定する。secret 実値の登録自体は**ユーザー操作**として手順化する（AI は実値を入力しない）。

---

## スコープ境界

| in scope | out of scope |
|----------|-------------|
| `.github/workflows/runtime-smoke-staging.yml` 編集（pre-check step 追加） | `scripts/smoke/runtime-attendance-provider.sh` のロジック変更 |
| `runbooks/secret-provisioning.md` 新規作成（5 secret 投入手順） | secret 実値の AI 投入 |
| readiness 不足時の `::error::` 出力で必要 secret 名を runner ログに残す | `staging` / `production` env の secret provisioning（task-01 / 別 runbook） |
| YAML 構文 / actionlint / secret 実値 grep gate | smoke スクリプトの再設計 |

---

## 不変条件

1. secret 実値はリポジトリ・コミット・PR 本文・runbook に**一切書かない**。
2. AI は `gh secret set` で値を入れない（値の正本は外部 — Cloudflare dashboard / Auth.js admin / 1Password）。
3. 既存 `scripts/smoke/runtime-attendance-provider.sh` の挙動は変更しない（pre-check で先に止めるだけ）。
4. readiness 不足時に「PASS のように見える skip」を生まない（明示 fail）。
5. `SLACK_WEBHOOK_INCIDENT` の readiness は failure 通知 step の既存 guard に任せ、pre-check の必須対象には含めない（incident 通知は best-effort）。

---

## 変更対象ファイル

| path | 種別 | 役割 |
|------|------|------|
| `.github/workflows/runtime-smoke-staging.yml` | edit | `mask staging credentials` step の直前に `verify required staging secrets` pre-check step を追加 |
| `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | new | `staging-runtime-smoke` env への 5 secret 投入手順 runbook |

---

## 対象 5 secret（`staging-runtime-smoke` env）

| secret 名 | 必須 pre-check | 取得元 |
|---|---|---|
| `STAGING_API_BASE` | yes | `apps/api/wrangler.toml` の staging worker URL |
| `STAGING_ADMIN_BEARER` | yes | staging で admin login → DevTools Network の `Authorization` ヘッダ |
| `STAGING_MEMBER_ID` | yes | staging D1 (`ubm-hyogo-db-staging`) `members.id` |
| `STAGING_ME_BEARER` | yes | staging で一般会員 login → DevTools Network の `Authorization` ヘッダ |
| `SLACK_WEBHOOK_INCIDENT` | no（既存 if-failure guard） | 1Password Vault `UBM-Hyogo / Slack incident webhook` |

---

## 受入基準

| # | 内容 |
|---|------|
| AC-T2-1 | `.github/workflows/runtime-smoke-staging.yml` に `verify required staging secrets` step が 1 回だけ存在する |
| AC-T2-2 | secret 未投入の状態で `dev` push したとき、smoke job が pre-check で fail し、runner ログに不足 secret 名 4 件が `::error::` で列挙される |
| AC-T2-3 | runbook が新規作成され、ユーザー単独で 5 secret を投入できる粒度の手順を持つ（コマンド逐語 + 取得元の指示 + 禁止事項） |
| AC-T2-4 | runbook と diff のいずれにも secret 実値が無い（`eyJ[A-Za-z0-9_-]{20,}` / `sk_[A-Za-z0-9]{20,}` / `hooks\.slack\.com/services/[A-Z0-9]{8,}` の grep が 0 件） |
| AC-T2-5 | secret 投入後の再実行で `runtime-smoke-staging / smoke` が pre-check を突破する |

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| 並列可 | task-01（web-cd secret 名整合）と独立。共有変更なし | 並列 |
| user-action | 5 secret の `gh secret set` 投入 | spec 完了後にユーザー実施 |

### task-01 と独立な根拠

task-01（web-cd secret 名整合）と本 task-02 が干渉せず並列実行可能である根拠を以下 3 点で示す:

1. **edit path 集合の disjoint**: task-01 は `.github/workflows/web-cd.yml` のみを編集する。task-02 は `.github/workflows/runtime-smoke-staging.yml` および `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` を編集対象とする。両 task の編集ファイル集合に重複は無い。
2. **target GitHub Environment が別**: task-01 の secret 投入対象は `staging` / `production` env、task-02 の対象は `staging-runtime-smoke` env。secret 集合は disjoint で、片方の rotation が他方の readiness に影響しない。
3. **workflow trigger graph 上で web-cd → runtime-smoke の edge 無し**: `runtime-smoke-staging.yml` は `backend-ci.yml` から `workflow_call` で呼ばれる構成で、`web-cd.yml` の deploy 結果に依存しない（親 README / index.md にも明記の通り）。よって task-01 の workflow 改修が task-02 の smoke 実行を block しない。

---

## Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | completed | `phase-1.md` |
| 2 | 設計レビュー | completed | `phase-2.md` |
| 3 | 実装計画 | completed | `phase-3.md` |
| 4 | テスト設計 | completed | `phase-4.md` |
| 5 | 実装手順 | completed | `phase-5.md` |
| 6 | 単体 / 静的検証 | completed | `phase-6.md` |
| 7 | 結合テスト | completed | `phase-7.md` |
| 8 | リファクタリング判断 | completed | `phase-8.md` |
| 9 | 品質ゲート | completed | `phase-9.md` |
| 10 | 最終レビュー | completed | `phase-10.md` |
| 11 | 手動受入 evidence | static-completed / runtime-pending | `phase-11.md` |
| 12 | ドキュメント同期 | completed | `phase-12.md` |
| 13 | PR 作成 | pending | `phase-13.md` |

---

## 正本順位（衝突時の優先度）

1. 親 `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md`
2. 親 `outputs/phase-{1,2,3}/phase-{1,2,3}.md`
3. 本 `index.md` / `phase-{1..13}.md`
4. `CLAUDE.md` シークレット管理セクション
