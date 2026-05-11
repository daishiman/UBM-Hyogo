# Phase 11: UI Sanity / Visual Review

## 評価方法

`PLAYWRIGHT_EVIDENCE_TASK=task-17-admin-schema-conflicts-audit` で local desktop Chromium を実行し、3 route の主要状態を `outputs/phase-11/screenshots/` に保存した。

## SchemaDiffPanel

- 4 ペイン (added/changed/removed/unresolved) を見出し + total で表示。
- stableKey alias 割当は modal ではなく inline form。
- retryable continuation は status 行で「Back-fill 再試行可能」を表示。
- validation / conflict / generic error は `role="alert"` と `data-feedback-kind` で区別。
- D1 直アクセスなし。Server Component は `fetchAdmin()` 経由。

## IdentityConflictRow

- source / target / matched fields を 1 行にまとめて表示。
- merge は inline 2 段階確認 (確認 1/2 → 確認 2/2 + reason textarea)。
- dismiss は inline reason textarea。
- error は `role="alert"` + `aria-live="polite"`。
- reason 空文字または pending 中は確定 button disabled。

## AuditLogPanel

- FilterBar は form (`action`, `actorEmail`, `targetType`, `targetId`, `from`, `to`, `limit`, `cursor`)。
- 一覧は table 表示。Timeline `<article>` グルーピングではない。
- before / after は masked JSON disclosure。
- CSV export UI は現行実装に存在しない。task-17 の非目標として扱う。
- cursor pagination は link で filters を保持する。

## 結論

実コードと Phase 11/12 の記述を inline form / inline confirmation / table 表示へ補正済み。10 screenshot と metadata は取得済み。
