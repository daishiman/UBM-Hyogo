# Phase 11: smoke test 結果 (AC-5)

> **ステータス: NOT EXECUTED (docs-only モード)**
> 本タスクは docs-only。実行時は本テンプレに沿って S-01〜S-10 の結果を記録する。

## 1. 実施環境

| 項目 | 値 |
| --- | --- |
| 実施日時 | TBD (YYYY-MM-DD HH:MM:SS JST) |
| 実施者 | TBD |
| 対象 web URL | TBD (例: `https://ubm-hyogo-web.<account>.workers.dev` または独自ドメイン) |
| 対象 api host | TBD (例: `https://ubm-hyogo-api.<account>.workers.dev`) |
| wrangler バージョン | TBD |
| 直前 Phase 5 完了時刻 | TBD |

## 2. smoke 一覧

| ID | 観点 | コマンド | 期待 | AC | 結果 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | Web Top 200 | `curl -sI https://<web-url>` | HTTP/2 200 | AC-1 | TBD | レスポンスヘッダを api-response-evidence.md に貼付 |
| S-02 | API /health 200 | `curl -sS https://<api-host>/health` | `{"status":"healthy"}` 等 | AC-2 | TBD | body も保管 |
| S-03 | API /health/db 200 | `curl -sS https://<api-host>/health/db` | D1 SELECT OK | AC-4 | TBD | body も保管 |
| S-04 | Web HTML 構造 | `curl -sS https://<web-url> \| head -n 50` | `<!DOCTYPE html>` 含む | AC-1 | TBD | |
| S-05 | API CORS preflight | `curl -sS -X OPTIONS -H "Origin: https://<web-url>" https://<api-host>/health` | 204 / 適切な Access-Control-* | AC-2 | TBD | |
| S-06 | wrangler tail エラー監視 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` (5 分) | error log なし | AC-2 | TBD | 観察結果を要約 |
| S-07 | D1 binding 経由 SELECT | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT 1"` | `1` を返す | AC-4 | TBD | |
| S-08 | Web→API XHR (実画面) | DevTools / Playwright で API 呼び出し確認 | 200 OK | AC-1 / AC-2 | TBD | スクショは screenshots/ |
| S-09 | favicon / static asset | `curl -sI https://<web-url>/favicon.ico` | 200 / 404 (許容) | AC-1 | TBD | |
| S-10 | レスポンスヘッダ | `curl -sI -D - https://<api-host>/health` | 適切なセキュリティヘッダ | AC-2 | TBD | |

## 3. 集計

| AC | 該当 smoke | 全 PASS? |
| --- | --- | --- |
| AC-1 | S-01 / S-04 / S-08 / S-09 | TBD |
| AC-2 | S-02 / S-05 / S-06 / S-08 / S-10 | TBD |
| AC-4 | S-03 / S-07 | TBD |
| AC-5 (全件 PASS) | S-01〜S-10 | TBD |

## 4. FAIL 時の対応

- いずれか FAIL → Phase 6 abnormal-case-matrix.md の該当シナリオに沿って rollback 検討
- AC-1 FAIL → A-6 / W-1 (Web)
- AC-2 FAIL → A-7 / W-1 (API)
- AC-4 FAIL → A-8 / D-1 + W-1

## 5. 出力ログ保管

各 smoke の生ログは `outputs/phase-11/api-response-evidence.md` に転記。スクショは `outputs/phase-11/screenshots/` 配下に YYYYMMDD-HHMMSS-<id>.png で保管。

## 6. 最終判定

- 判定: TBD (PASS / FAIL)
- PASS 条件: S-01〜S-10 全件 PASS かつ S-06 wrangler tail で error log なし
