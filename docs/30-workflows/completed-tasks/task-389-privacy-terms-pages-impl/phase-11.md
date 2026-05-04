# Phase 11: 実測 evidence 収集 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

staging / production deploy 後に AC-1〜AC-6 の evidence を実測で取得する。

## 実測項目と evidence path

| AC | 内容 | 実測コマンド / 操作 | 保存先 |
| --- | --- | --- | --- |
| AC-1 | staging /privacy 200 | `curl -s -o /dev/null -w "%{http_code}\n" $STAGING_HOST/privacy` | `outputs/phase-11/manual-smoke-log.md` |
| AC-2 | staging /terms 200 | 同上 | 同上 |
| AC-3 | production /privacy 200 | `curl ... $PROD_HOST/privacy` | 同上 |
| AC-4 | production /terms 200 | 同上 | 同上 |
| AC-5 | 法務確認文面適用 | reviewer + date を記載 | `outputs/phase-11/legal-review-note.md` |
| AC-6 | OAuth consent URL 設定 | Cloud Console 編集画面 screenshot | `outputs/phase-11/consent-screen-screenshot.png` |

## 必須出力ファイル

- `outputs/phase-11/main.md` — Phase 11 サマリ（PASS/FAIL 一覧）
- `outputs/phase-11/manual-smoke-log.md` — curl 実行結果（4 エンドポイント分の HTTP code 行を保存）
- `outputs/phase-11/consent-screen-screenshot.png` — Google Cloud Console OAuth consent screen 画面
- `outputs/phase-11/legal-review-note.md` — 法務レビュー結果と適用文面バージョン

## manual-smoke-log.md フォーマット

```
## 2026-MM-DD HH:MM JST  staging deploy version=<wrangler version id>
GET https://<staging>/privacy -> 200
GET https://<staging>/terms   -> 200

## 2026-MM-DD HH:MM JST  production deploy version=<wrangler version id>
GET https://<production>/privacy -> 200
GET https://<production>/terms   -> 200
```

## VISUAL_ON_EXECUTION 注記

仕様書作成時点では実測値は未取得。Phase 11 main.md は `pending explicit user instruction / runtime smoke not yet executed` の placeholder で初期化し、実行後に PASS で上書きする。

## 完了条件

- [ ] 4 エンドポイント全て HTTP 200 が記録されている
- [ ] consent screen screenshot が evidence 保存されている
- [ ] 法務適用バージョンが記録されている（暫定の場合は明示）
- [ ] `outputs/phase-11/main.md` を作成する
