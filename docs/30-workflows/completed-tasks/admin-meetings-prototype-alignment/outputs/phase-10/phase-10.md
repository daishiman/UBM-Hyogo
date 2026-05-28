# Phase 10: Final Review

## 10.1 目的

実装着手前の仕様 package として、Task A/B が矛盾なく実装可能かを最終確認する。
本 Phase はコード review ではなく、実装前 review gate として扱う。

## 10.2 実行タスク

1. Phase 1 AC と Task A/B の DoD が 1:1 で対応していることを確認する。
2. Phase 11 evidence と Phase 12 strict 7 の物理配置を確認する。
3. aiworkflow-requirements の正本同期先を確認する。

## 10.3 参照資料

- `outputs/phase-1/phase-1.md`
- `tasks/task-A-meetings-list-redesign.md`
- `tasks/task-B-meeting-detail-alignment.md`
- `outputs/phase-12/system-spec-update-summary.md`

## 10.4 成果物

| Review item | Verdict |
| --- | --- |
| AC coverage | completed (spec package) |
| Phase 1-13 files | completed (spec package) |
| Phase 12 strict 7 | completed |
| implementation runtime | spec_created / user-gated |

## 10.5 統合テスト連携

`node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/admin-meetings-prototype-alignment` を最終 verification として使う。
Phase 12 heading gate は `COMPLIANCE_BASE_REF=dev pnpm verify:phase12-compliance` で確認する。

## 10.6 完了条件

- [x] 実装前仕様 package としての最終 review 観点が記録されている。
- [x] `spec_created` と runtime pending の境界が明示されている。
- [x] PR / commit / push が user-gated として残っている。
