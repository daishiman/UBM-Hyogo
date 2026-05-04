# Phase 2 — 設計

## ADR セクション構成
`_design/sync-jobs-spec.md` §1 メタ表直下に「## ADR-001 runtime SSOT 配置」見出しを追加。
Status / Date / Decision / Context / Rationale / Alternatives / Links の標準 ADR 構造。

## owner 表行スキーマ
`| ファイル | owner task | co-owner task | 変更時の必須レビュアー | 備考 |` の 5 列。
追加行: `apps/api/src/jobs/_shared/sync-jobs-schema.ts | 03a | 03b | 03a / 03b | sync_jobs runtime contract 正本…`

## 参照リンク経路
- §2 表脚注: owner 表へのリンク
- §3 metricsJsonBaseSchema 段落: runtime SSOT への明示リンク
- §5 lock 制御: TTL 変更時のレビュアー境界 owner 表参照

## 苦戦箇所への対応
L-005 用語 alias を冒頭に挿入。L-001 に基づき runtime SSOT は `apps/api` 維持。
