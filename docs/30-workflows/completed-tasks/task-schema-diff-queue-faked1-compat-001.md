# task-schema-diff-queue-faked1-compat-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-schema-diff-queue-faked1-compat-001 |
| 分類 | test quality |
| 優先度 | 中 |
| ステータス | consumed_by_current_verification |
| 発見元 | issue-109 UT-02A quality-report |
| 解決先 | `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/` |

## 概要

`apps/api/src/repository/schemaDiffQueue.test.ts` の既存 fail 2 件を、fakeD1 と `schema_diff_queue` repository contract の互換性問題として切り出して修正する、という前提で作成された旧 unassigned task。

2026-05-05 の current worktree verification では focused Vitest が 7/7 PASS となり、旧 fail は再現しなかった。そのため本ファイルは実行対象ではなく、Issue #379 workflow への historical trace として保持する。

## 苦戦箇所【記入必須】

UT-02A 当時は、全体 `pnpm --filter @ubm-hyogo/api test` で schemaDiffQueue の list 系 2 件が既存 fail として残ると記録していた。現在は `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/outputs/phase-1/baseline.txt` と `outputs/phase-11/after.txt` で同 focused test が 7/7 PASS と確認済み。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| UT-02A 当時の stale fail 記録が未タスクとして残り続ける | 本ファイルを `consumed_by_current_verification` とし、Issue #379 workflow へ誘導する |
| repository contract と fake が再度 drift する | 新たな failing evidence が出た場合のみ、別の current evidence 付き workflow として再起票する |

## 検証方法

- `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/repository/schemaDiffQueue.test.ts` が PASS。
- `docs/30-workflows/issue-379-schema-diff-queue-faked1-compat/outputs/phase-11/test-log-diff.md` で baseline / after ともに 7/7 PASS。

## スコープ

含む: historical trace、current verification workflow への誘導。
含まない: UT-02A tag queue 実装変更。
含まない: fakeD1 互換修正、repository query 修正、該当 test 変更（現時点で不要）。
