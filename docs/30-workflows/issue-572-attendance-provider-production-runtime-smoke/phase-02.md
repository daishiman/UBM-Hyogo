# Phase 2: スコープ確定 / wrangler.toml binding 差分整理 / endpoint surface 固定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| Source | `outputs/phase-2/phase-2.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

`apps/api/wrangler.toml` の `[env.production]` と `[env.staging]` の binding 名・値の差分を整理し、production smoke が参照する endpoint surface（`/admin/members`, `/admin/members/:memberId`, `/me/profile`, `/me/attendance`）を固定する。含む / 含まないを最終確定し、issue-371 state 更新 commit の対象ファイルパスを確定する。

## 実行タスク

詳細は `outputs/phase-2/phase-2.md` を正本とする。要点:

- `apps/api/wrangler.toml` の `[env.production]` / `[env.staging]` を grep して binding 差分表（DB / KV / vars / secrets）を作成
- production endpoint surface 4 種を route 定義（`apps/api/src/routes/`）と照合し fix
- 親タスク（issue-371）state 更新の対象ファイルパスを特定（`docs/30-workflows/issue-371-.../` 配下の state 記述箇所 / artifacts.json / index.md のいずれが正本かを確定）
- 含まない（write 系 smoke / 新規 endpoint / schema 変更 / monitoring）の最終固定

## 統合テスト連携

Phase 7 で実装する `run-smoke.sh` が、本 phase で確定した binding 名と endpoint surface のみを参照することを Phase 10 単体テストで gate する。

## 参照資料

- `apps/api/wrangler.toml`
- `apps/api/src/routes/admin/members*` / `apps/api/src/routes/me/*`
- issue-371 spec ディレクトリ
- `outputs/phase-1/phase-1.md`

## 成果物

- `outputs/phase-2/phase-2.md`

## 完了条件

- wrangler.toml binding 差分表が確定し、endpoint surface 4 種と issue-371 state 更新対象パスが固定されている。
