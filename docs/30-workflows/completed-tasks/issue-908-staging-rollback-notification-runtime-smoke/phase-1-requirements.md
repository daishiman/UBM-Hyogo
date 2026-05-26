---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 1: 要件定義 — タスク仕様書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 1 |
| Phase名 | 要件定義 |
| 機能名 | issue-908-staging-rollback-notification-runtime-smoke |
| 実装区分 | 実装仕様書（smoke helper + evidence MD + parent mutation） |

---

## 目的

親 issue-838（schema alias rollback notification）の AC-6（staging runtime evidence）を取得し、tracked evidence MD として残す。再現性確保のため smoke helper script を追加する。

---

## 要件

### 機能要件

1. staging 環境にデプロイ済みの `apps/api` に対し schema alias rollback を実行し、Slack/mail 通知 dispatch + `audit_log` 記録を実機確認する
2. 以下 3 ケースの runtime smoke を実施する:
   - **S-sent**: Slack/mail 設定済み → 通知 sent + audit `status=sent`
   - **S-skipped**: 両 channel 未設定 → 通知 skipped + audit `status=skipped`, `channel=none`, `attempts=0`
   - **S-failed**: 意図的無効 webhook 注入 → 通知 failed + rollback HTTP 200 維持 + audit `status=failed`
3. smoke helper script `scripts/runtime-smoke/schema-alias-rollback.sh` を追加し、`--dry-run` モード（D1 mutation / curl POST を skip）と通常モードを切替可能にする
4. 全結果を evidence MD `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` に記録する
5. 親 `manual-test-result.md` の Status を `local_evidence_captured_runtime_pending` → `runtime_evidence_captured` に更新する
6. 親 `artifacts.json` の Phase 11 status / Gate-C status を更新する

### 非機能要件

- secret 実値（webhook URL / token / Authorization header / mail key）を helper stdout / log / evidence MD に転記しない（redact 関数経由必須）
- helper script の実行は user-gated（`[USER-GATE]` プレフィクス付き confirm prompt）
- helper script の syntax は `bash -n` で検証可能
- `--dry-run` 実行は副作用ゼロ（rollback POST も D1 mutation も発生しない）

---

## inventory

### 既存実装（編集対象外・参照のみ）

| 項目 | パス |
| --- | --- |
| dispatch module | `apps/api/src/workflows/schemaAliasRollbackNotification.ts` |
| rollback route | `apps/api/src/routes/admin/schema.ts` |
| Cloudflare CLI wrapper | `scripts/cf.sh` |

### 新規作成

| 項目 | パス |
| --- | --- |
| smoke helper | `scripts/runtime-smoke/schema-alias-rollback.sh` |
| evidence MD | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` |

### 編集対象

| 項目 | パス | 変更内容 |
| --- | --- | --- |
| 親 manual-test-result | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | Status 行更新 + evidence MD 相互リンク追加 |
| 親 artifacts.json | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | Phase 11 status / Gate-C status / evidence_path 更新 |

---

## 命名規則

- helper script: `scripts/runtime-smoke/<feature-slug>.sh` 形式（既存 runtime-smoke ディレクトリの命名に追従）
- evidence MD: `outputs/phase-11/evidence/<scenario-slug>.md` 形式
- audit action: `schema_alias.rollback_notification`（親 issue-838 で確定済み）

---

## P50（過去問題の予防）

| ID | 過去事例 | 本タスクでの対策 |
| --- | --- | --- |
| P50-1 | secret 実値が evidence MD に転記された（UT-17 followup-001 早期 draft） | helper の redact 関数 + evidence MD 雛形に `<REDACTED>` placeholder を予め埋める |
| P50-2 | wrangler 直接実行で esbuild バージョン不整合 | helper 内も `bash scripts/cf.sh` 経由を強制 |
| P50-3 | dry-run 不在で smoke 試行のたび staging D1 mutation 発生 | `--dry-run` モードを default-suggested に提示し、本実行は user confirm 必須 |
| P50-4 | 親 artifacts.json mutation 後 gate-metadata:validate で evidence_path 不在 fail | evidence MD を helper 実行前に最小 placeholder で先行 commit 可能な構造とし、Phase 5 で先に空 evidence file を作成する手順を含める |

---

## AC 確定

index.md「受入条件」§AC-1〜AC-7 を本 Phase で確定する。

---

## 完了条件

- [x] 機能/非機能要件を確定
- [x] inventory（既存・新規・編集対象）を確定
- [x] 命名規則を確定
- [x] P50 を確定
- [x] AC-1〜AC-7 を確定

---

## 次Phase

`phase-2-design.md`（設計）へ進む。
