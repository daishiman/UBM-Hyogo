# Phase 8: before / after

本タスクは Phase 8 main.md にて **YAGNI 判定（抽象化しない）** が確定したため、before / after の差分は無い。

| 項目 | before | after |
| --- | --- | --- |
| 公開 API | （新規）| `getSheetsAccessToken(env)` |
| 抽象化 | n/a | 行わない |
| private util | n/a | `redact` / `withBackoff` をモジュール内 closure |

将来 Drive / Calendar API 追加時に再評価する。
