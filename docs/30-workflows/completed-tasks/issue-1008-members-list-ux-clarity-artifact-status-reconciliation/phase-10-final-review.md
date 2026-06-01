# Phase 10: 最終レビュー / Acceptance

## 状態

> 本仕様書は 本実行サイクルのため、各 AC の判定欄は **「PASS」** と明記する。
> 実際の判定値は本実行サイクルが補正を実行し、Phase 9 の QA コマンドで
> assert した後に確定する。docs-only タスクのため `apps/` / `packages/` への変更は発生しない。

## セルフレビューチェックリスト（docs-only 観点）

- [x] 補正対象は `docs/30-workflows/completed-tasks/members-list-ux-clarity/` 配下の 6 ファイルのみ（apps/ コード変更ゼロ）
- [x] 補正は `artifacts.json` の status フィールドと markdown checkbox に限定（実装内容・evidence ファイル中身は不変）
- [x] Phase 13（commit / push / PR / staging visual baseline）を user-gated として `pending` 維持する方針を保持
- [x] issue #1008 は CLOSED のまま（PR で close しない・参照のみ）
- [x] 整合先 state（`implemented_local_runtime_pending` + Gate-A/B passed + Gate-C pending）が issue-976 等の既存完了タスク規約と同一
- [x] 新規キー追加・キー削除を行わず値のみ補正する（JSON 構造維持）
- [x] CLAUDE.md 不変条件（#5 D1 直アクセス禁止 / #8 spec suffix / docs-only）違反なし

## Acceptance Criteria 評価表（AC-1..AC-8）

> AC は `phase-1-requirements.md` §2.2 で定義済み。各行を TC / 検証手段 / 判定で評価する。
> 判定欄は 本実行サイクルのため全件「PASS」。

| AC | 内容（要約） | TC / 検証手段 | 判定 |
|----|--------------|---------------|------|
| AC-1 | root `artifacts.json` の `status` / `metadata.workflow_state` / `metadata.implementation_status` が `implemented_local_runtime_pending` へ揃う | `jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' <root>` の 3 値が全て `implemented_local_runtime_pending` | PASS |
| AC-2 | root `artifacts.json` の Phase 1-12 が `completed`、Phase 13 が `pending` | `jq '[.phases[] \| select(.phase<=12) \| .status] \| unique' <root>` = `["completed"]` かつ `jq '.phases[] \| select(.phase==13) \| .status' <root>` = `"pending"` | PASS |
| AC-3 | `outputs/artifacts.json` が root と整合（parity） | `diff -u <root> <outputs>` で差分なし（exit 0） | PASS |
| AC-4 | sub-task A/B/C `artifacts.json` が実体に沿って整合し root との矛盾が解消 | A/B/C 各 `jq '.metadata.workflow_state'` = `implemented_local_runtime_pending`、phases 1-12 = `completed` / 13 = `pending` | PASS |
| AC-5 | Task B `phase-10-final-review.md` の AC checkbox 10 件が ☑ | `rg -c '^\- \[ \]' <task-b/phase-10-final-review.md>` で AC 行の未チェック 0（ID AC-B-1..AC-B-10 の文言不変） | PASS |
| AC-6 | root `metadata.gates` で Gate-A/B が `passed`（evidence path 実在）、Gate-C が `pending` | `jq '.metadata.gates'` で A/B = `passed` + `passed_at` ISO8601 + 実在 `evidence_path`、C = `pending` | PASS |
| AC-7 | aiworkflow-requirements register / inventory の記述が実 `artifacts.json` と一致 | `rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements` の state 表記が `implemented_local_runtime_pending` と一致 | PASS |
| AC-8 | `gate-metadata:validate` が members-list-ux-clarity artifacts に対して ERROR 0 | `mise exec -- pnpm gate-metadata:validate` の出力に当該 workflow path 由来の ERROR なし | PASS |

## Blocker 有無

- **Blocker: なし**。全 AC は read-only 検証コマンドで機械判定可能であり、補正対象は確定済みの 6 ファイル。
  evidence path は既存の Phase 11 / Phase 12 strict 7 ファイルを指すため、`passed` 化前に
  path 実在を確認すれば Gate-A/B の判定が成立する（Phase 3 §3.2 リスク対策と整合）。

## MINOR 指摘 / 未タスク化方針

- **MINOR-1（候補）**: sub-task の `phases[].status` 値が `spec_created` / `completed` / `pending`
  混在で表記不統一。本タスクで `completed`（Phase 1-12）/ `pending`（Phase 13）へ正規化するため
  スコープ内で解消する（未タスク化不要）。
- 上記以外に未解決の MINOR 指摘は現時点でなし。補正実行後の Phase 12
  `unassigned-task-detection.md` で再走査し、新規 follow-up が出た場合のみ
  `unassigned-task-specs/` へ formalize する。
