# 未タスク検出レポート

## 検出ソース

| ソース | 確認結果 |
| ------ | -------- |
| 元タスク「スコープ外」 | 4 件（拡張機能由来 / favicon.ico）|
| Phase 3/10 レビュー MINOR | 0 件 |
| Phase 11 手動テスト発見事項 | runtime_pending（staging/visual は user-gated）|
| `TODO/FIXME/HACK/XXX` | 0 件（変更ファイル内）|
| `describe.skip` | 0 件 |

## 候補

| ID | 内容 | 判定 | 理由 |
| -- | ---- | ---- | ---- |
| U-001 | `apps/web` favicon.ico を提供して 404 を解消する | **却下** | 今回の login form / Google icon / magic-link / prototype 表示と独立。観測ログにもユーザーフロー破断なし |
| U-002 | pre-push hook (`lefthook.yml`) に `scripts/verify-no-process-env-internal-api.sh` を追加 | **今回吸収** | grep gate script を同一 wave で追加。hook wiring は既存 CI/lefthook方針に従うため個別未タスク化しない |
| U-003 | `apps/web/{src,app}` 全体で `process.env` 直参照を環境変数毎に検出する汎用 grep gate へ拡張 | **却下** | 過剰一般化。3 件目の env 変数が出たら検討 |
| U-004 | プロトタイプ index.html を CI で playwright headless 描画チェック | **却下** | 開発専用 asset、コスト過大 |
| U-005 | 拡張機能由来 console error を Sentry filter rule で抑制 | **却下** | アプリ由来でないログを production filter 対象として扱う根拠が不足。今回の正本には除外判定だけ残す |

## 0 件確認

今回の実行サイクルで吸収すべき改善は実ファイルに反映済み。新規 unassigned issue は 0 件。
