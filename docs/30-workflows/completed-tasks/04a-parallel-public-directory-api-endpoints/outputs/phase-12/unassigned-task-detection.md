# Unassigned task detection — 04a

タスク仕様書に明記されているが、現スコープ外（後続タスクへ移送）の項目を検出する。

## 検出結果

| ID | 内容 | 移送先 | 理由 |
| --- | --- | --- | --- |
| U-1 | miniflare ベースの contract / integration / leak suite | 06a または別タスク | 04a は unit + converter で leak を担保。E2E は `apps/web` 公開時の方が ROI が高い |
| U-2 | `/public/members/:id` の KV cache | 将来タスク | traffic >3k/day 到達時の最適化、現時点で過剰最適化 |
| U-3 | `apps/web` 用 query parser の `packages/shared` 配置 | 06a | 06a で `apps/web` がパース実装を必要とする時点で同等実装を `shared` に置く |
| U-4 | Cloudflare cache rules による Cache-Control override の検証 | Phase 11 manual smoke | deploy 後に `curl -I` で確認するのみ |
| U-5 | tags 一括取得の N+1 防止 (multi-member 対応) | 後続タスク | 現状 1 member ずつ tag 取得で問題ないが、members list で expand 要望が出たら検討 |

## 不明 / 仕様欠落の指摘

- なし。Phase 1 の AC-1〜AC-12 で網羅されている。

## 結論

未割当タスクは全て後続タスクに移送可能で、04a の完了を妨げるものはない。
