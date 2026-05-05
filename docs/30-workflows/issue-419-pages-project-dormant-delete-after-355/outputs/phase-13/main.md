# Phase 13 — PR 作成

state: blocked_pending_user_approval
workflow_state: spec_created
taskType: implementation
visualEvidence: NON_VISUAL

commit / push / `gh pr create` は **本仕様書作成サイクル（spec_created）では実行しない**。declared outputs は placeholder のみ配置し、user 明示承認後の別 cycle で本作成する。

## declared outputs

| ファイル | 状態 | 役割 |
| --- | --- | --- |
| `outputs/phase-13/main.md` | placeholder | 本ファイル |
| `outputs/phase-13/pr-template.md` | drafted | PR タイトル / body / AC マトリクス / Test plan / Refs #355 |
| `outputs/phase-13/pr-creation-result.md` | blocked | user 承認後 cycle で PR URL / merge 結果を埋める |

## 二重承認 gate

| Gate | 対象 | 承認形態 |
| --- | --- | --- |
| Gate 1 | spec_created PR（本 Phase 13 で作成する PR） | PR review approve |
| Gate 2 | runtime cycle（Pages 物理削除の実行） | PR comment / Issue comment で user 明示承認文言（AC-4） |

Gate 1 通過 ≠ Gate 2 通過。spec PR が merge されても Pages は削除されない。

## PR タイトル（spec_created PR）

```
docs(issue-419): Cloudflare Pages dormant 削除運用タスク仕様書
```

## 禁止事項（再掲）

- `--no-verify` 使用禁止 / force push 禁止
- PR description / commit message に `Closes #355` を書かない（親 #355 CLOSED のため `Refs #355` のみ）
- spec PR に Pages 削除実行 / aiworkflow-requirements 書き換えを混在させない
