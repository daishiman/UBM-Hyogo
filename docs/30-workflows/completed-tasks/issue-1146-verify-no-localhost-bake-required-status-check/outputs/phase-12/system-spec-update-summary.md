# システム仕様更新サマリ

| 項目 | 値 |
| --- | --- |
| タスク | issue-1146 `verify-no-localhost-bake` を dev/main の required status check に登録 |
| ステータス | `implemented_local_runtime_pending` |
| 生成パターン | Closed Issue Canonical Workflow Root Recovery + Governance Mutation |
| Issue | [#1146](https://github.com/daishiman/UBM-Hyogo/issues/1146)（CLOSED 維持・`Refs #1146`） |

---

## Step 1-A: 完了タスク記録

| 項目 | 内容 |
| --- | --- |
| タスク状態 | `implemented_local_runtime_pending`（Phase 1-13 タスク仕様書 + Phase 12 strict 7 + local yml 実装 + aiworkflow workflow sync 完了） |
| 完了スコープ | yml paths 除去 local 実装 + local verification + dev/main 個別 governance PUT 手順の確定 |
| 実行委譲 | `gh api -X PUT` / commit / PR は **user-gated**（後続 prompt） |
| Issue 参照 | refs_only（`Refs #1146`・CLOSED 維持・reopen しない） |
| recovered_from_unassigned | proto-spec path 記録済（consumed pointer 追記・削除禁止） |

---

## Step 1-B: 実装状況テーブル

| 対象 | 状態 | 備考 |
| --- | --- | --- |
| `.github/workflows/verify-no-localhost-bake.yml`（paths 除去） | `implemented_local_runtime_pending` | local edit 完了・grep LOGIC 不変 |
| `dev` branch protection（context 追加） | `implemented_local_runtime_pending` | 個別 GET → payload → PUT 手順確定・実 PUT は user-gated |
| `main` branch protection（context 追加） | `implemented_local_runtime_pending` | 同上（branch 別 payload） |
| `scripts/verify-no-localhost-bake.sh` / `.spec.ts` | 不変 | grep LOGIC 不変（変更対象外） |

---

## Step 1-C: 関連タスクテーブル

| 関連 | 関係 | 状態 |
| --- | --- | --- |
| 親 workflow `staging-api-url-and-session-recovery` | gate 本体（yml/.sh/.spec.ts）を landed（commits 8f7d4faca / 6aee9fcba） | completed-tasks |
| 消費元 proto-spec `staging-api-url-and-session-recovery-followup-002-...` | 本 canonical workflow root の生成元 | consumed（pointer 追記・削除禁止） |
| Issue #1146 [FU-SASR-002] | 本タスクの対象 issue | CLOSED 維持（refs_only） |

---

## Step 2: システム仕様（aiworkflow-requirements）正本更新

**API/interface 正本は N/A。workflow 正本同期は実施済み。**

理由: 本タスクは新規 interface / 型 / API surface を一切追加しない。
変更内容は (1) CI workflow の trigger 設定（paths 除去）と (2) GitHub branch protection の `required_status_checks.contexts` への context 追加であり、
いずれも **CI governance の設定変更**に閉じる。アプリケーションの型定義・公開 API・データ契約に変化がないため、
aiworkflow-requirements の API/interface 正本仕様（interface / schema / API surface）の更新対象は存在しない。

ただし Closed Issue recovery workflow として、次の workflow 正本同期は同 cycle で実施済み:

- `.claude/skills/aiworkflow-requirements/references/workflow-issue-1146-verify-no-localhost-bake-required-status-check-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/SKILL-changelog.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260608-issue1146-verify-no-localhost-bake-required-status-check.md`

> API/interface Step 2 が N/A であることと、workflow inventory/index sync を実施することは両立する。
