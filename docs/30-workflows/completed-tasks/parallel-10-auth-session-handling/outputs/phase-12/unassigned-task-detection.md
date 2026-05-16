# Unassigned Task Detection

## Result

- 新規未タスク件数: 0

## 本サイクルで決定根拠だけ残す項目（スコープ外）

| 項目 | 決定 | 根拠 |
| --- | --- | --- |
| Auth.js silent refresh | MVP 不採用 | Google OAuth scope 拡張 + Workers Paid + refresh token 取得が前提。24h TTL 内 expiry は 401 catch → redirect で吸収可能 |
| e2e で 401 → `/login` redirect の CI gate 化 | 本サイクル外 | 本タスクは NON_VISUAL の local hook / a11y contract。既存 Playwright runtime smoke は上位 runtime gate で扱う |
| 既存 admin mutation の全面置換 | 本サイクル外 | 今回の完了条件は共通 hook と contract 固定。既存 caller は endpoint 固有の 400/409/422 UI 分岐を持つため、機械的一括置換は UX contract 破壊リスクがある。新規 admin mutation から `useAdminMutation` を採用し、既存 caller は個別 UI contract を維持しながら段階移行する |
