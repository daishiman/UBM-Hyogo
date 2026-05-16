# Phase 8: リファクタリング

## 対象 | Before | After | 理由

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| guard script の重複 grep | TC-03 URL 除外と TC-05 anchor 除去が個別 grep | 単一 awk もしくは sed pipeline に集約 | I/O 削減・読みやすさ。1 サイクル内で必要に応じて適用、過剰なら見送り |
| report 文字列構築 | `report="${report}...\n"` の incremental append | tmpfile に書き出して end でまとめて echo | bash 互換性向上（embedded `\n` の `printf` 依存を回避） |

> 本タスクは変更規模が小さいため、過度なリファクタは行わない。挙動が同値であることを TC-01〜TC-07 で再確認する。
