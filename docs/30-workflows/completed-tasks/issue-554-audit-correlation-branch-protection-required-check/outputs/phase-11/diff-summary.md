# diff-summary

## 状態

**PARTIAL（before snapshots only / after pending Phase 13）**

本 Phase は `visualEvidence: NON_VISUAL` のためスクリーンショットなし。JSON snapshots が evidence の正本。

## dev

- before contexts: `["ci", "Validate Build", "coverage-gate"]`
- after  contexts: **(pending Phase 13)**
- 期待追加: `audit-correlation-verify / verify`
- 不変条件 grep: PARTIAL（drift findings は Phase 1 / Phase 10 参照）

## main

- before contexts: `["ci", "Validate Build", "coverage-gate"]`
- after  contexts: **(pending Phase 13)**
- 期待追加: `audit-correlation-verify / verify`
- 不変条件 grep: PARTIAL（drift findings は Phase 1 / Phase 10 参照）

## 実施日時

- before スナップショット取得: 2026-05-08（GET API、副作用なし）
- dev PUT: pending Phase 13
- main PUT: pending Phase 13

## evidence ファイル一覧

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-11/before-dev-protection.json` | ✅ 取得済 |
| `outputs/phase-11/before-main-protection.json` | ✅ 取得済 |
| `outputs/phase-11/after-dev-protection.json` | ⏳ Phase 13 |
| `outputs/phase-11/after-main-protection.json` | ⏳ Phase 13 |
| `outputs/phase-11/dev-diff.txt` | ⏳ Phase 13 |
| `outputs/phase-11/main-diff.txt` | ⏳ Phase 13 |
| `outputs/phase-11/diff-summary.md` | ✅（本ファイル / Phase 13 で更新） |
| `outputs/phase-11/pr-pending-check.txt` | optional / Phase 13 |

## drift findings（Phase 1 / Phase 10 サマリ）

| 不変条件 | dev | main | 本タスクで修正 |
| --- | --- | --- | --- |
| `required_pull_request_reviews=null` | ✅ | ❌ | スコープ外 |
| `enforce_admins=true` | ❌ | ❌ | スコープ外 |
| `required_linear_history=true` | ❌ | ❌ | スコープ外 |
| `lock_branch=false` | ✅ | ✅ | — |
| `required_conversation_resolution=true` | ✅ | ✅ | — |
| contexts に `audit-correlation-verify / verify` | 未追加 | 未追加 | Phase 13 で追加 |

drift 受容方針は Phase 13 ユーザー gate で確定。
