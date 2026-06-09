# Phase 13: PR作成

本タスクは **Closed Issue Canonical Workflow Root Recovery + Governance Mutation** パターンの実装仕様書（implemented_local_runtime_pending）。
本 Phase では (a) `.github/workflows/verify-no-localhost-bake.yml` の paths 除去 edit、(b) `dev` / `main` branch protection の `gh api -X PUT` mutation、(c) commit / push / PR を規定する。
**(a)(b)(c) はすべて user 明示承認後のみ AI が実行可能**。Issue #1146 は **CLOSED 維持**・reopen しない・PR/commit は `Refs #1146` のみ（`Closes` 禁止）。

---

## 1. Governance Mutation Gate（branch protection PUT）

dev / main を **個別に** GET → payload draft → PUT → after GET する。**単一 payload の使い回しは禁止**（branch 別に独立した payload を生成する）。

| branch | before evidence | payload draft | after evidence | user 承認 |
| --- | --- | --- | --- | --- |
| `dev` | `outputs/phase-13/branch-protection-current-dev.json`（GET / pre-gate 可） | `outputs/phase-13/branch-protection-payload-dev.json`（PUT 入力 / pre-gate 可） | `outputs/phase-13/branch-protection-after-dev.json`（PUT 直後 GET） | ⏸ pending |
| `main` | `outputs/phase-13/branch-protection-current-main.json`（GET / pre-gate 可） | `outputs/phase-13/branch-protection-payload-main.json`（PUT 入力 / pre-gate 可） | `outputs/phase-13/branch-protection-after-main.json`（PUT 直後 GET） | ⏸ pending |

承認 marker: `outputs/phase-13/user-approval-issue-1146-<timestamp>.md`（user 明示承認後に生成）。

### 1-1. payload 構築の不変条件

| 不変条件 | 内容 |
| --- | --- |
| contexts 保持 | 既存 5 件 `["ci","Validate Build","coverage-gate","lighthouse-ci","e2e-tests-coverage-gate"]` を全件保持し、**末尾に** `"verify-no-localhost-bake"` を追加 |
| 他フィールド逐語再投入 | `required_pull_request_reviews=null` / `enforce_admins=true` / `restrictions=null` / `required_linear_history=true` / `required_conversation_resolution=true` / `lock_branch=false` を before GET の値で逐語再投入 |
| branch 独立 | dev payload を main へ流用しない（branch 別 GET の値を基に個別生成） |
| drift ゼロ | after GET で上記フィールドが before と一致することを確認 |

---

## 2. 実行手順（user 承認後のみ AI 実行可）

```bash
# 0) local edit は完了済み:
#    .github/workflows/verify-no-localhost-bake.yml の on.pull_request.paths ブロックのみ除去

# 1) dev を PUT
gh api -X PUT --input outputs/phase-13/branch-protection-payload-dev.json \
  repos/daishiman/UBM-Hyogo/branches/dev/protection

# 2) 直後に fresh GET → after-dev.json
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  > outputs/phase-13/branch-protection-after-dev.json

# 3) main を同手順
gh api -X PUT --input outputs/phase-13/branch-protection-payload-main.json \
  repos/daishiman/UBM-Hyogo/branches/main/protection
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  > outputs/phase-13/branch-protection-after-main.json

# 4) compliance-check の governance 行を更新
#    outputs/phase-12/phase12-task-spec-compliance-check.md の
#    Gate-C / governance 行を `completed (runtime PASS / approved at <ISO8601>)` に更新
```

手順順序（厳守）: **dev payload PUT → dev fresh GET（after-dev.json）→ main payload PUT → main fresh GET（after-main.json）→ compliance-check 更新**。

---

## 3. PR 作成

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev`（CLAUDE.md ブランチ戦略） |
| issue 参照 | `Refs #1146`（**`Closes` 禁止** / Issue CLOSED 維持） |
| diff 内容 | `.github/workflows/verify-no-localhost-bake.yml` の paths 除去 edit + 本 workflow root 一式 |
| evidence 添付 | `outputs/phase-13/branch-protection-{current,payload,after}-{dev,main}.json` と approval marker を PR 本文で参照 |

> branch protection の PUT は GitHub API 直接操作であり PR diff には現れない。PR 本文に before/after evidence と approval marker を明示し、governance mutation を監査可能にする。

---

## 4. user-gated 境界（厳守）

| 操作 | 区分 |
| --- | --- |
| `.github/workflows/verify-no-localhost-bake.yml` の paths 除去 edit | local 実装済み |
| `gh api -X PUT` dev / main（2 回） | **user-gated** |
| before GET（`branch-protection-current-{dev,main}.json`）/ payload draft | pre-gate 可（read-only / draft） |
| commit / push | **user-gated** |
| PR 作成（base dev, Refs #1146） | **user-gated** |
| Issue #1146 state 変更 / reopen | **禁止**（CLOSED 維持・refs_only） |

`governance_mutation_user_gate=true`。3-state（`implemented_local_runtime_pending` → `runtime_pending` → `completed`）で進行し、PUT / after evidence / approval marker は user 明示承認後にのみ生成・実行する。

---

## 5. 完了判定

PR がマージされ、dev/main 両 branch の after evidence に `verify-no-localhost-bake` を含む 6 context が確認でき、
governance drift がゼロであれば **completed**。それまでは `runtime_pending`。本 prompt では `implemented_local_runtime_pending` で停止する。
