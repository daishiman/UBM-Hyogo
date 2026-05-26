# システム仕様書更新サマリ

## 対象 specs

| ファイル | 更新区分 | 内容 |
| -------- | -------- | ---- |
| `docs/00-getting-started-manual/specs/00-overview.md` | Step 1-A | 完了タスク行追加（`login-ui-balance-and-runtime-fix`）|
| `docs/00-getting-started-manual/specs/00-overview.md` | Step 1-B | 実装状況テーブルを `implemented_local_runtime_pending` として登録 |
| `docs/00-getting-started-manual/specs/02-auth.md` | Step 2（軽微） | magic-link / auth proxy が `getAuthEnv()` 経由で `INTERNAL_API_BASE_URL` を解決する旨を追記 |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | Step 2（軽微） | `/login` UI balance / Google icon CSS isolation の現行契約を追記 |
| `docs/30-workflows/LOGS.md` | 必須 | task entry 追加 |

## Step 2 判定

- 新規 interface 追加: なし（既存 `getAuthEnv()` / `getPublicFetchEnv()` を使用）
- 既存 interface 変更: なし
- API 仕様変更: なし
- 結論: **specs ファイル本体の構造変更不要、軽微記載のみ**

## 関連タスクテーブル更新

| 関連タスク | 更新 |
| ---------- | ---- |
| `task-02 wrangler-env-injection` の「関連タスク」表 | 当タスク行を追記（apps/web env 抽象の追加カバー） |
| `task-18 design-tokens-and-grep-gate` の「関連タスク」表 | 当タスク行を追記（regression grep gate 追加） |
| `login-page-prototype-alignment` | `/login` の後続実装修正として当タスクを参照 |

## ドキュメント更新履歴連携

`outputs/phase-12/documentation-changelog.md` に詳細列挙。
