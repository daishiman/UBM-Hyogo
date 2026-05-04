# Phase 1: 要件定義 — outputs/main

## 判定

`PASS_WITH_BLOCKER`（lifecycle: `blocked_by_legacy_cleanup`）。

## 真の論点と確定

| 論点 | 確定方針 |
| --- | --- |
| 既存 `ci` job 内に step を追加するか、新 job を立てるか | 既存 `ci` job 内に追加。required status context (`ci`) drift を避けるため新 job 化は scope out |
| legacy cleanup と本タスクの実装順序 | legacy cleanup 完了（strict 0 violations）が技術的前提。本サイクルでは ci.yml を変更しない |
| branch protection の取り扱い | required_status_checks `contexts` の正本確認のみ。PUT は scope out |

## AC 確定（再掲）

`index.md` の AC-1〜AC-7 を本 Phase の確定要件として採用。

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created",
  "lifecycle_state": "blocked_by_legacy_cleanup"
}
```

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | strict 0 violations 未達時に CI gate を有効化しない方針で AC と整合 |
| 漏れなし | PASS | AC-1〜7 / dependencies / scope in-out / lifecycle states を網羅 |
| 整合性 | PASS | 03a 親 workflow / aiworkflow-requirements / branch protection 正本と整合 |
| 依存関係 | PASS | legacy cleanup を blocking 上流として明示 |

## 完了条件チェック

- [x] index.md の AC と矛盾しない。
- [x] strict 0 violations 未達のため blocking CI gate を有効化しない方針を確定。
- [x] blocker evidence は Phase 11 で実体化済み（`evidence/strict-current-blocker.txt`）。

## 次フェーズ引き継ぎ

- Phase 2 で ci.yml diff 設計（条件付き編集）を確定し、現サイクルでは適用しない。
