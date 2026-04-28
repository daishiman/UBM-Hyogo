# Phase 8 — リファクタリング

## Status

completed

## サマリ

本タスクは implementation であり、実装コードを生成しない。Phase 8 のリファクタリングは「設計成果物（`lefthook.yml` 案・移植スクリプト 2 本・post-merge 廃止判定）」に対する構造整理レビューとして実施する。Phase 2 で提示した yaml 1 + shell 2 の構成、および post-merge から `indexes/*.json` 再生成を切り離す方針を、レビュー観点で再点検し Before/After 表に集約する。

## リファクタリング対象（設計成果物）

1. `lefthook.yml`（Phase 2 design.md §1）
2. `scripts/hooks/staged-task-dir-guard.sh`（旧 `.git/hooks/pre-commit` 移植）
4. `.git/hooks/post-merge` の `indexes/*.json` 再生成ロジック（**削除**）

## リファクタリング方針

| 方針 | 内容 |
| --- | --- |
| Single Source of Truth | hook 設定の正本を `lefthook.yml` に一本化。`.git/hooks/*` は派生物として手動編集禁止。 |
| 副作用の局所化 | `post-merge` から書き込み副作用（indexes 再生成）を除去。通知 lane は read-only に統一。 |
| インライン回避 | yaml に shell をインラインせず、`scripts/hooks/*.sh` に切り出して diff レビュー性を確保（ADR-03）。 |

## 成果物

- `outputs/phase-8/before-after.md` — 対象 / Before / After / 理由 テーブル

## 受入再確認

- [x] yaml 1 + shell 2 の構成が Phase 2 設計と一致
- [x] post-merge での indexes 再生成削除を Before/After に明記
- [x] 通知 lane 共通化の理由が説明されている
- [x] `.git/hooks/*` を直接編集する運用の廃止が明示されている
