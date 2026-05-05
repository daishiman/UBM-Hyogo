# Phase 11 outputs — main

## ステータス

- 状態: **placeholder（spec 段階。実 smoke 未実施）**
- 実 smoke を実施した時点で本ファイル冒頭ステータスを `executed` に更新し、各 evidence ファイルへのパスと観測 status code を追記する。

## evidence 一覧（保存先 = `outputs/phase-11/evidence/`）

| ファイル | 役割 | AC trace | 現状 |
| --- | --- | --- | --- |
| `evidence/local-curl.log` | local `apps/web → apps/api → D1` 4 route family / 5 smoke cases 観測 | AC-2 / AC-3 | pending（spec_created planned evidence） |
| `evidence/staging-curl.log` | staging 4 route family / 5 smoke cases + `PUBLIC_API_BASE_URL` deployed vars 確認メモ | AC-4 / AC-5 | pending（spec_created planned evidence） |
| `evidence/staging-screenshot.png` | staging `/members` 正常応答 screenshot 1 枚。curl 主体の補助 evidence であり VISUAL 判定や visual regression には使わない | AC-6 | pending（spec_created planned evidence） |
| `manual-smoke-log.md` | Phase 11 実行ログの人間可読サマリ | AC-1〜7 | pending |
| `link-checklist.md` | 06a 親タスクへの相対リンク trace 確認 | AC-6 | pending |

## 観測結果サマリ（実行後に追記）

| ルート | local 期待 | local 実測 | staging 期待 | staging 実測 |
| --- | --- | --- | --- | --- |
| `/` | 200 | _pending_ | 200 | _pending_ |
| `/members` | 200 | _pending_ | 200 | _pending_ |
| `/members/<seed-id>` | 200 | _pending_ | 200 | _pending_ |
| `/members/UNKNOWN` | 404 | _pending_ | 404 | _pending_ |
| `/register` | 200 | _pending_ | 200 | _pending_ |

## 06a 親タスクへの evidence 追記

- 追記先: `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-11/`
- 追記内容: 本タスク evidence ディレクトリへの相対リンクと追記日付（実 smoke 実施時に記録）

## 機微情報チェック

- [ ] `local-curl.log` に Authorization / API Token が含まれていない
- [ ] `staging-curl.log` に D1 database ID / Cloudflare account ID が含まれていない
- [ ] `staging-screenshot.png` にブラウザ拡張・他タブ・個人メール表示が含まれていない

## 次フェーズへの引き継ぎ

- spec_created PR では planned evidence として扱う。Phase 11 実行後に、本ファイルのステータスを `executed` に更新してから runtime runbook 反映へ進む。
