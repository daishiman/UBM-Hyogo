# 05a Follow-up 002: Google OAuth Verification

> 状態: merged_into `docs/30-workflows/ut-05a-followup-google-oauth-completion/`（spec_created）
> 統合日: 2026-04-30
> 注記: 単独未タスクとしては新規実行せず、統合 workflow の Stage B/C で実行する。

## 苦戦箇所【記入必須】

05a は MVP では Google OAuth testing user 運用を許容したが、本番公開前には Google OAuth verification / consent screen の審査状態を確定する必要がある。未対応のままだと testing user 以外の会員がログインできない。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 本番公開時に未検証アプリ警告または testing user 制限でログイン不能 | 本番 domain / privacy policy / redirect URI / scope を整理し、Google Cloud Console で verification を申請する |
| OAuth client secret の取り扱いが属人化する | 1Password / Cloudflare Secrets / GitHub Secrets の配置表を更新し、平文を残さない |

## 検証方法

- Google Cloud Console の OAuth consent screen が production ready であることを確認
- 本番/staging redirect URI が登録済みであることを確認
- testing user 以外の Google account で login smoke を実施

## スコープ（含む/含まない）

含む:

- OAuth consent screen / client 設定の本番化
- secrets 配置表の更新
- verification 完了後の login smoke

含まない:

- Magic Link provider
- UBM アプリ内 UI 改修
