# U-UT01-09 retry / offset policy lessons

## L-UUT0109-001: docs-only canonical decision でも正本導線を同 wave で閉じる

workflow 内で「追補候補」と書くだけでは後続実装が旧仕様を参照する。docs-only / spec_created でも、起票元 unassigned、quick-reference、resource-map、database-schema、task-workflow-active、SKILL / LOGS を同じ wave で同期する。

## L-UUT0109-002: technical GO と user approval を分離する

Phase 10 の GO は Phase 11 / 12 の文書 close-out へ進む技術判定であり、commit / push / PR の承認ではない。`technical_go=true` と `user_approved=false` を併記する。

## L-UUT0109-003: offset は invocation budget と invalidation 条件まで書く

cron tick 間隔に収まることと、1 invocation の wall-clock / CPU budget に収まることは別問題。chunk index offset を採る場合は、行削除 / 挿入 / 並べ替え時の invalidation 条件と full backfill / stable high-water fallback を実装委譲に含める。
