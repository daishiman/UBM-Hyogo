---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 7: カバレッジ確認 — タスク仕様書

## メタ情報

| Phase | 7 | Phase名 | カバレッジ |
| --- | --- | --- | --- |

---

## 適用方針

bash helper script は vitest coverage の対象外（既存 `vitest.config.ts` の `include` に bash は含まれない）。代替として以下を coverage 相当の根拠とする:

| Subject | 検証 | 結果（spec 記載・実行は user-gated） |
| --- | --- | --- |
| helper script の syntax 全網羅 | `bash -n` | spec: exit 0 |
| helper 全分岐（--dry-run / 通常 / user-abort） | Phase 6 T-1 / T-2 | spec: 全 PASS |
| 親 implementation 行カバレッジ回帰 | 親 issue-838 Phase 7 で確認済（変更なし） | spec: 既存維持 |

---

## 完了条件

- [x] helper bash script の検証方針確定
- [x] 親 implementation coverage への影響ゼロ確認

---

## 次Phase

`phase-8-refactor.md`
