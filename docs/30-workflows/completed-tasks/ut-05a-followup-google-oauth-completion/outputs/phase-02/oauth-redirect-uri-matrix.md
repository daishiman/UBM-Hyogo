# OAuth Redirect URI Matrix

> Phase 2 設計成果物 1 / Owner: UT-05A-FOLLOWUP-OAUTH

## 単一 OAuth client 方針

Google Cloud Console「OAuth 2.0 Client ID」は **1 project 内で 1 client に統合** し、
local / staging / production の 3 redirect URI を同一 client に列挙する。

理由:

- consent screen は project 単位で 1 つしか production publish できない
- verification 申請も project 単位なので、複数 client に分散すると申請対象 client が drift
- secrets 配置表が 1 client 分で済み DRY

例外: ローカル開発専用に第 2 client を分けたい場合は consent screen を `Internal` で運用。本タスクは原則 1 client。

## redirect URI 一覧

| 環境 | host | callback URL | OAuth client 登録 | scheme | 動作確認 |
| --- | --- | --- | --- | --- | --- |
| local dev | `http://localhost:3000` | `http://localhost:3000/api/auth/callback/google` | 同一 client に列挙（dev 例外で http） | `http://` | `pnpm --filter web dev` で起動し M-01 |
| staging | `https://<staging-domain>` | `https://<staging-domain>/api/auth/callback/google` | 同一 client | `https://` | Phase 11 Stage A |
| production | `https://<production-domain>` | `https://<production-domain>/api/auth/callback/google` | 同一 client | `https://` | Phase 11 Stage C |

## URI 正規化ルール

- 末尾スラッシュ **無し** で統一（`/google` で終わる）
- scheme は `https://` 固定（local dev のみ `http://`）
- host 大文字小文字は小文字統一
- `apps/web/wrangler.toml` の `[env.staging] / [env.production]` の `routes` または `vars.AUTH_URL` から実 host を取得

## staging/production の実 host 名取得手順

```bash
# Phase 11 実行時に実値を取得（仕様書には実値を転記しない）
grep -E '^routes\s*=|^pattern\s*=|AUTH_URL' apps/web/wrangler.toml
grep -E '^routes\s*=|^pattern\s*=|AUTH_URL' apps/api/wrangler.toml
```

取得した host を `outputs/phase-11/staging/redirect-uri-actual.md` / `outputs/phase-11/production/redirect-uri-actual.md` に埋めて保存（実 host は staging/production の actual ファイルにのみ記載）。

## Phase 5 / 11 での参照

- Phase 5 Step A-1「Google Cloud Console redirect URI 登録」で本表をコピペ
- Phase 11 で実 host を埋めた actual 表を staging / production それぞれに保存し、Console 登録一覧と diff 0 を確認
