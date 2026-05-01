# manual-smoke-log

## ステータス

- 状態: pending（Phase 11 smoke 未実行）
- visualEvidence: NON_VISUAL
- 主 evidence: curl log
- 補助 evidence: staging screenshot 1 枚（visual regression ではない）

## 実行後に記録する項目

| AC | 記録内容 | evidence |
| --- | --- | --- |
| AC-1 | `scripts/cf.sh` 経由の local API fresh 起動 2 回 | `evidence/local-curl.log` |
| AC-2 | local 4 route family HTTP status | `evidence/local-curl.log` |
| AC-3 | `.items | length >= 1` または D1 query trace | `evidence/local-curl.log` |
| AC-4 | staging 4 route family HTTP status | `evidence/staging-curl.log` |
| AC-5 | deployed worker vars が localhost fallback していないこと | `evidence/staging-curl.log` |
| AC-6 | 親 06a への相対リンク trace | `link-checklist.md` |
| AC-7 | `apps/web` D1 direct import 0 件 | `evidence/local-curl.log` |

## 結果

未実行。user が Phase 11 実 smoke を開始した後に追記する。
