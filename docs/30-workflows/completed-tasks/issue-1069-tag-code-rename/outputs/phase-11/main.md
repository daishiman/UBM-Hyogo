# Phase 11: 手動テスト検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1069-tag-code-rename` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| status | `completed` |

## 目的

tag master `code` rename の local deterministic evidence を確認し、UI screenshot が不要な NON_VISUAL 境界を明確化する。

## 実行タスク

- focused D1 Vitest 4 files を実行し、rename success / conflict / stale / audit / member_tags regression を確認する。
- API typecheck、repo lint、static manifest verification を実行する。
- commit / push / PR / staging runtime / Issue mutation が user-gated のまま残っていることを確認する。

## 参照資料

- `manual-test-result.md`
- `manual-smoke-log.md`
- `link-checklist.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物

- `manual-test-result.md`: NON_VISUAL evidence summary
- `manual-smoke-log.md`: executed command result summary
- `link-checklist.md`: local evidence and user-gated boundary links

## 統合テスト連携

focused D1 Vitest 4 files / 37 tests PASS。API typecheck PASS、repo lint PASS、`verify:static-manifest` PASS。

## 完了条件

- [x] NON_VISUAL のため screenshot 不要と記録した
- [x] focused D1 Vitest が PASS した
- [x] typecheck / lint / static manifest verification が PASS した
- [x] user-gated 境界を記録した
