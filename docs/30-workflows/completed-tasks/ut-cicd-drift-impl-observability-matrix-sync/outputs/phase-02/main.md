# Phase 2 Output: 設計サマリー

## 更新設計

| 更新点 | 方針 |
| --- | --- |
| 環境別観測対象 | dev / main に `backend-ci.yml` / `web-cd.yml` / `verify-indexes.yml` を追加 |
| 識別子マッピング | workflow file / display name / job id / required status context の 4 列を分離 |
| 通知状態 | 5 workflow すべて Discord / Slack 通知未実装として注記 |
| 旧path | `docs/05a-` 形式の参照は新pathへ置換対象 |

## 破棄判断

既存SSOTは無料枠・環境別観測対象・rollback基準を保持しており、全面破棄は不要。観測対象表と識別子表を追加するパッチ修正が最小複雑性で要件を満たす。
