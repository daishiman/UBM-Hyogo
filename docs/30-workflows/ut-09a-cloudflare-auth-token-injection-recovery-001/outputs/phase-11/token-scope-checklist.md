# Cloudflare API Token scope checklist

実行日: 2026-05-04
方式: ユーザー確認（1Password item 説明欄 / Cloudflare dashboard token 設定画面）。token 値は読まない。

## 必要 scope

| scope | 用途 | 確認 |
| --- | --- | --- |
| Account: Workers Scripts:Edit | `wrangler deploy`（API / Web Worker） | ☐ confirmed_by_user |
| Account: Workers Routes:Edit | route 配置 | ☐ confirmed_by_user |
| Account: D1:Edit | D1 migrations apply / export | ☐ confirmed_by_user |
| Account: Pages:Edit | Pages 連携（必要時） | ☐ confirmed_by_user |
| Account: Workers Tail:Read | `wrangler tail` | ☐ confirmed_by_user |
| User: User Details:Read | `wrangler whoami` で email を返す（任意） | optional（現状未付与でも whoami exit 0） |

## 間接確認（runtime 側）

| 項目 | 結果 |
| --- | --- |
| `bash scripts/cf.sh whoami` exit 0 | PASS |
| identity に account name / account ID が出力 | PASS |
| `User-> User Details:Read` 未付与の警告（email 表示不可） | 観測（運用に影響なし） |

token 値・実 vault 名・実 item 名は記録していない。AC-4 は `whoami` 復旧に必要な認証経路として PASS。deploy / D1 / tail の個別 scope は本タスクの実行範囲外で、親 `ut-09a-exec-staging-smoke-001` の staging deploy / tail 再実行時に Cloudflare dashboard で確認する。したがって本ファイルは deploy readiness の PASS 証跡ではなく、scope 確認 SOP と runtime `whoami` 間接証跡として扱う。
