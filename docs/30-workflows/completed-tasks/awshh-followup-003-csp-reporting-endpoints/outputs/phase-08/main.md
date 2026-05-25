# Phase 8 output: リファクタリングサマリ

- グループ名を `CSP_REPORT_GROUP` 単一定数に集約（CSP / Reporting-Endpoints / Report-To drift 排除）。
- report 系出力判定を `buildReportingEndpointsHeader` null 判定 + spread に 1 箇所化。
- env は getPublicEnv 経由のみ（直書きなし）。
- 詳細: [phase-08.md](../../phase-08.md)
