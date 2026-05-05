# Phase 08 — DRY 化 (実行結果)

[実装区分: 実装仕様書]

## 状態

spec_created で判断確定。runtime での見直しは Phase 9 PASS 後に必要であれば追記する。

## 共通化候補と採否

| 候補 | 採否 | 理由 |
| --- | --- | --- |
| evidence skeleton 共通ヘッダ | 採用（手動コピー） | 7 ファイル限定。スクリプト化のコストの方が高い |
| `scripts/cf.sh` の `pages` helper | 不採用 | passthrough 設計を維持。1 タスク限定の wrapper は user 承認 gate を skip する誘惑を生む |
| redaction grep 共通化 | 不採用 | 検索パターンが他 workflow と異なる（Cloudflare token vs admin PII）。共通化で検出漏れリスク |
| dormant 観察 sampling script | 不採用（再評価予定） | 取得経路未確定。手動運用 ≥ 2 サンプルで十分。本タスク後に再評価 |

## 既存資産の再利用

| 既存 | 再利用方針 |
| --- | --- |
| `scripts/cf.sh` | wrangler 直叩き禁止に従い必ず経由。新規 helper 追加なし |
| issue-355 親仕様の Phase 11 smoke | AC-1 根拠のリンク参照のみ |
| `outputs/phase-11/` ディレクトリ規約 | 既存命名と `PENDING_RUNTIME_EXECUTION` ヘッダを踏襲 |

## 非 DRY 化の判断

| 候補 | 非 DRY 化理由 |
| --- | --- |
| `pages project delete` wrapper | 1 回限り destructive。wrapper 化で安全性低下 |
| evidence template generator | 手動 7 ファイルで十分 |

## 残課題

- 将来同種 ops（KV namespace / R2 bucket 削除等）が登場した時点で、本判断の再評価を実施
