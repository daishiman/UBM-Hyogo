# Phase 11: 手動評価実行

## 種別: NON_VISUAL（CLI / ヘッダ証跡 + プライバシーレビュー）

UI/UX 変更はないため screenshot は不要。証跡はヘッダ到達ログとプライバシーレビューメモ。

## 実行手順（本サイクルで実施）

### 1. ヘッダ到達確認（staging）

```bash
curl -sI https://<staging-url>/ \
  | grep -iE "reporting-endpoints|content-security-policy" \
  > outputs/phase-11/evidence/reporting-endpoints-curl.log
```

期待: `Reporting-Endpoints: csp-endpoint="https://..."`、`Report-To: {"group":"csp-endpoint",...}`、`Content-Security-Policy-Report-Only: ...; report-to csp-endpoint; report-uri https://...` が出力される。

### 2. 違反送信確認

- staging で意図的に inline でない外部 script を読み込ませ、ブラウザ DevTools Network で Sentry security endpoint への POST を確認。
- Sentry プロジェクトの Security/CSP issues に違反が記録されることを確認。

### 3. apps/api / D1 不変確認

```bash
git diff --stat -- apps/api apps/api/migrations > outputs/phase-11/evidence/apps-api-untouched.log
```

期待: 0 件。

### 4. プライバシーレビュー → `outputs/phase-11/evidence/privacy-review.md`

CSP violation report payload の主要項目と個人情報該当性:

| payload 項目 | 個人情報該当性 | 対応 |
| --- | --- | --- |
| `document-uri` | パスに `/members/[id]` 等の会員 id を含む可能性（間接識別子） | Sentry data scrubbing で id 部分をマスク or サーバー側 scrubbing rule |
| `referrer` | 遷移元 URL。会員ページ由来なら間接識別子 | 同上 |
| `blocked-uri` | 違反リソース URL。通常 PII なし | そのまま |
| `source-file` / `line-number` | 自サイト資産。PII なし | そのまま |

retention / 運用方針:
- 受信・保存・retention は Sentry 側に委譲。Sentry のデフォルト retention（プラン依存・例 90 日）を採用し、追加の D1 保存はしない。
- 大量流入時は Sentry の rate limit / inbound filter で抑制。
- プライバシーポリシー（`/privacy`）への追記要否を判断（CSP 違反収集を Sentry に送信する旨）。

## evidence 一覧（実行時生成）

| ファイル | Status（仕様作成時点） |
| --- | --- |
| `outputs/phase-11/evidence/reporting-endpoints-curl.log` | pending |
| `outputs/phase-11/evidence/privacy-review.md` | pending |
| `outputs/phase-11/evidence/apps-api-untouched.log` | pending |

> 本仕様書は implemented_local_evidence_captured。evidence はuser-gated runtime 実行時に生成するため Status=pending（物理ファイル未生成）。

## 次フェーズ引き継ぎ

Phase 12 で implementation-guide / runbook / consumed trace / 7 ファイルを整える。
