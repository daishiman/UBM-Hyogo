# Phase 1 成果物 — 要件定義 + binding 棚卸し表

## binding 棚卸し表（current code facts: 2026-05-31）

| binding | 種別 | env.ts 型 | wrangler.toml 状態 | 用途 | runtime 実体 |
| --- | --- | --- | --- | --- | --- |
| `DB` | D1Database | 必須 | prod/staging 有効 | 正規化 DB | 稼働中 |
| `UBM_AUDIT_COLD_STORAGE` | R2Bucket | `?:`（optional） | prod L120 / staging L202 有効 | Cloudflare Audit Logs cold storage (#514) | 稼働中（gate 承認後 bucket 作成） |
| `UBM_AUDIT_APP_COLD_STORAGE` | R2Bucket | `?:`（optional） | prod L127 / staging L208 有効 | application audit_log cold storage (#315) | 稼働中（`export-to-r2.ts` が `.put()`） |
| `ALERT_DEDUP_KV` | KVNamespace | `?:`（optional） | prod L134 / staging L216 **コメントアウト** | alert-relay dedup (ut-17-followup-002) | **未活性**（delivery fail-open） |
| `SYNC_ALERTS` | AnalyticsEngineDataset | `?:` | staging 有効 | per-sync write cap event | 稼働中 |
| `R2_BUCKET`（UT-12） | R2Bucket | 未宣言 | 未適用 | 汎用ファイル/画像 | spec_created（本 task 対象外） |
| `SESSION_KV`（UT-13） | KVNamespace | 未宣言 | 未適用 | session/rate-limit cache | 本 task 対象外 |

## 正本ドリフト一覧（是正対象）

| 正本ファイル | 現記述 | 実体 | 是正 AC |
| --- | --- | --- | --- |
| `deployment-cloudflare.md` (R2 セクション) | 「R2 binding 未適用」 | audit R2 binding 2 本が prod/staging 適用済 | AC-2 |
| `deployment-cloudflare.md` (KV 注記) | 「KV binding 未追加」 | `ALERT_DEDUP_KV` 型宣言済（toml コメントアウト） | AC-2 |
| `specs/08-free-database.md` 無料枠表 | KV/R2 行なし | KV/R2 利用開始（R2 稼働） | AC-1 |
| `cost-guardrail-runbook.md §2-7/§4-2` | 「R2 未利用」「KV binding がない場合」前提・degrade 実行不能 | R2 稼働中 | AC-3 |

## KV / R2 free-tier limits（実行日に公式 doc で再確認し確認日を記入する）

| サービス | metric | free-tier（要再確認） |
| --- | --- | --- |
| KV | reads / writes / deletes / list / storage / namespaces | 100k reads/day・1k writes/day・1k deletes/day・1k list/day・1GB storage/account・1k namespaces |
| R2 Standard | storage / Class A / Class B / egress | 10GB-month storage・1M Class A/月・10M Class B/月・egress 無料 |

> 上表は記録時点の一般値。実装実行日に Cloudflare 公式 doc で再確認し「確認日: YYYY-MM-DD」を runbook / 正本に併記する。

## 受け入れ基準

AC-1〜AC-6（`phase-01.md` §5 参照）。
