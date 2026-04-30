# Phase 3: 設計レビュー

## Alternatives

| 案 | 判定 | 理由 |
| --- | --- | --- |
| DB 制約のみ | REJECT | API が 409 + existing row を返せない |
| App 層のみ | REJECT | race condition に弱い |
| DB 制約 + API 409 | ADOPT | AC-1/7 と運用性を同時に満たす |

## PASS/MINOR/MAJOR

PASS。既存 route パターンに合わせて明示的 audit append を採用したため、middleware 新設は見送る。MAJOR blocker はなし。
