# Phase 11 発見事項（discovered-issues）

手動テスト計画・設計レビュー過程で発見したスコープ外事項を記録する。current（今サイクル対応）と baseline（未タスク候補）を分離する。

## current（今サイクルで対応）

- なし（真因 A の 500 解消と真因 B の retry 回復は Lane A / Lane B でスコープ内）。

## baseline（未タスク候補・Phase 12 unassigned-task-detection と同期）

| ID | 事項 | 理由 / 対応先 |
|----|------|--------------|
| B-1 | `MemberTagsEditor` 子 fetch（`fetchMemberTags`）の個別エラー回復強化 | 本不具合の経路外（成功時のみマウント）。MINOR。別タスク候補 |
| B-2 | `member_tags.source` への DB CHECK 制約追加 | migration 変更は本ワークフロー不変条件で禁止。値ドメイン是正はコード層で吸収済み。migration 別タスク |
| B-3 | `01-api-schema.md` への source 値ドメイン注記 | 契約不変のため必須ではない。ドキュメント補足として将来検討 |

「機能影響なし」を理由に baseline 計上を省略していない（全件列挙）。
