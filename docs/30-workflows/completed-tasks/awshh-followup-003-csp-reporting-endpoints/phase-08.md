# Phase 8: リファクタリング

## 変更（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| グループ名 | CSP と Reporting-Endpoints / Report-To に文字列直書きの恐れ | `CSP_REPORT_GROUP` 単一定数を各所で参照 | グループ名 drift を構造的に排除（AC-2） |
| report 系出力判定 | buildCspDirective と buildSecurityHeaders に重複した if が出る恐れ | `buildReportingEndpointsHeader` の null 判定 + spread 条件で 1 箇所化 | 判定ロジックの DRY 化 |
| env 参照 | middleware に URL 直書きの恐れ | `getPublicEnv()` 経由のみ | env アクセス不変条件遵守 |

## DRY 化の確認

- URL は `reportEndpoint` 1 経路でのみ流れる（env → config → header/directive）。直書き定数を増やさない。
- `report-uri` の URL と `Reporting-Endpoints` / `Report-To` の URL は同一 `cfg.reportEndpoint` を参照（重複定義なし）。

## navigation drift チェック

- 新規 export は `buildReportingEndpointsHeader` / `buildReportToHeader` のみ。既存 export 名は不変（後方互換）。
- テストの import パスは既存と同一（`./security-headers`）。

## 次フェーズ引き継ぎ

Phase 9 で typecheck / lint / secret hygiene / env 不変条件を一括判定する。
