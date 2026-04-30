# Phase 11: 手動 smoke（NON_VISUAL 縮約テンプレ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed（NON_VISUAL evidence テンプレ作成完了。実機 smoke は実装 wave で記録） |
| visualEvidence | NON_VISUAL — UI screenshot 不要、curl / 疎通ログで evidence を確保 |

## 目的

`packages/integrations/google/src/sheets/auth.ts` から取得した access_token で、Sheets API v4 `spreadsheets.values.get` に疎通できることを実機で確認する。screenshot 不要のため、curl 出力 / wrangler dev ログ / Cloudflare Secrets list 出力を evidence とする。

## 成果物（NON_VISUAL 縮約セット）

| パス | 内容 |
| --- | --- |
| outputs/phase-11/main.md | smoke 実行サマリ |
| outputs/phase-11/manual-smoke-log.md | curl / log evidence テンプレート（実値は redact） |
| outputs/phase-11/link-checklist.md | リンク健全性 |

## 完了条件

- [x] NON_VISUAL evidence テンプレートとして `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点を作成
- [x] AC-4 / AC-6 / AC-10 の evidence 受け皿を `manual-smoke-log.md` に集約
- [x] log redact 方針を成果物に明記
- [x] screenshot ファイルを作成しない（NON_VISUAL）
