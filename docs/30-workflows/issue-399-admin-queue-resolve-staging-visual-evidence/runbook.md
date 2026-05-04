# Runbook — staging visual evidence capture (issue-399)

`/admin/requests` の 7 状態を staging で取得するための手順書。
本 runbook は `Phase 11 — staging visual evidence` の実取得サイクルで使用する。

## 0. 事前条件

- `.env` に 1Password 参照 (`op://Vault/Item/Field`) が設定済 (`scripts/cf.sh` 経由で `op run` される)
- staging に `apps/api` / `apps/web` が deploy 済
- 1Password vault に `staging admin account` 認証情報 (`email` / `password` または magic link 受信用 inbox) が登録済
- 取得結果保存先: `docs/30-workflows/issue-399-admin-queue-resolve-staging-visual-evidence/outputs/phase-11/`

## 1. seed 投入

```bash
CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh
```

- 失敗条件: 環境変数 `CLOUDFLARE_ENV != staging` の場合は exit 1（NFR-02 ガード）
- 投入後の確認:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
  --command "SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%';"
# 期待: c=5
```

## 2. admin login

1. ブラウザを **新規 Incognito window** で起動（拡張機能・既存セッション分離）
2. `https://web-staging.ubm-hyogo.workers.dev/admin/requests` へアクセス
3. 1Password から admin 認証情報を取得し sign-in（**コピーした値を docs / コードに残さない**）

## 3. screenshot 取得（7 状態）

| # | ファイル名 | 操作 | 注意 |
|---|------------|------|------|
| 01 | `01-pending-visibility-list.png` | `?type=visibility_request&status=pending` フィルタの状態 | 上位 3 件が `ISSUE399-NOTE-V*` |
| 02 | `02-pending-delete-list.png` | `?type=delete_request&status=pending` フィルタの状態 | 上位 2 件が `ISSUE399-NOTE-D*` |
| 03 | `03-detail-panel.png` | `ISSUE399-NOTE-V1` の detail panel を開いた状態 | reason / payload が表示されること |
| 04 | `04-approve-modal.png` | `ISSUE399-NOTE-V2` の approve confirm modal | resolutionNote 入力欄が空の状態 |
| 05 | `05-reject-modal.png` | `ISSUE399-NOTE-V3` の reject confirm modal | resolutionNote 入力欄に短い理由を入れた状態 |
| 06 | `06-empty-state.png` | **cleanup 後** に再アクセスしたときの空状態 | 07 取得と cleanup 完了後に取得 |
| 07 | `07-409-toast.png` | 同一行を 2 タブで approve → 後発タブの 409 toast | cleanup 前に取得する |

保存先: `outputs/phase-11/screenshots/`（PNG 推奨）

## 4. redaction

各 screenshot に対し以下を黒塗り / モザイク:

- ヘッダの admin email
- DevTools パネル（撮影前にすべて閉じる）
- Cookie / token を含む request panel（DevTools 撮影しない）

確認結果を `outputs/phase-11/redaction-check.md` に各画像ごと PASS で記録する。

## 5. cleanup

409 toast は cleanup 前に取得する。cleanup 後は対象行がなくなるため、最後に empty state を取得する。

```bash
CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh
```

- 内部で count=0 を verify する。失敗時は exit 1
- cleanup 後にブラウザで `/admin/requests` を再読込し `06-empty-state.png` を取得する

## 6. metadata 出力

`outputs/phase-11/phase11-capture-metadata.json` を以下スキーマで作成:

```json
{
  "captured_at": "ISO8601",
  "staging_url": "https://web-staging.ubm-hyogo.workers.dev",
  "admin_account_ref": "op://Vault/Item/Field",
  "fixture_summary": { "pending_visibility": 3, "pending_delete": 2 },
  "screenshots": [
    { "file": "01-pending-visibility-list.png", "captured_at": "...", "redaction_applied": ["admin_email"] }
  ],
  "cleanup_verified_at": "ISO8601",
  "cleanup_verified_count": 0
}
```

## 7. Phase 11 サマリ作成

`outputs/phase-11/main.md` / `manual-test-result.md` / `discovered-issues.md` を更新し、Phase 11 を `PASS` 化する。

## NG 条件

- secret / 実 PII / 内部 URL（admin email 等）が screenshot に残っている
- cleanup verify が count > 0
- 7 状態のいずれかが取得できていない
- 上記いずれの場合も commit / push せず差し戻し
