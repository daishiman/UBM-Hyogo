# Phase 11: デプロイ / staging smoke

[実装区分: 実装仕様書]

`/profile` 画面はサーバ側の D1 schema 変更を伴わないため、**コードのデプロイのみ**で完結する。
本 phase ではローカル → dev (staging) → main (production) の手順と確認項目を確定する。

Status: `runtime_pending`。この仕様書 wave では runtime deploy / smoke / Sentry observation は実行しない。staging deploy、production deploy、smoke 実行、commit、push、PR はすべてユーザー明示承認後に実施する。

---

## 1. 前提

| 項目 | 値 |
|------|----|
| 影響を受ける Worker | `apps/web` (Next.js via `@opennextjs/cloudflare`) |
| D1 migration | **無し** |
| Secrets / Variables 追加 | **無し** |
| 既存 API endpoint | 変更無し（`apps/api` 不変） |
| rollback 方式 | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env <env>` |

---

## 2. デプロイ flow

```
[local]
  pnpm typecheck / lint / test / typecheck / lint / test / profile token grep 全 green
        │
        ▼
[feature/task-14-my-profile-and-requests]
  PR open to dev
        │  ── CI gate（typecheck, lint, test, e2e-tests-coverage-gate, profile token grep）
        ▼
[dev branch merge]
  Cloudflare staging に自動 deploy
        │  ── staging smoke（§4）
        ▼
[release: dev → main PR]
  CI gate 再走
        │
        ▼
[main branch merge]
  Cloudflare production に自動 deploy
        │  ── production smoke（§5）
        ▼
[Sentry 監視 24h]
```

---

## 3. デプロイコマンド（手動 fallback）

通常は GitHub Actions の自動 deploy が行うが、緊急時の手動経路:

```bash
# staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

`scripts/cf.sh` 経由必須（CLAUDE.md §「Cloudflare 系 CLI 実行ルール」）。`wrangler` 直接実行禁止。

---

## 4. staging smoke（dev branch merge 後）

| # | シナリオ | 期待 |
|---|---------|------|
| 1 | 未ログインで `/profile` | `/login?redirect=/profile` へ redirect |
| 2 | テストアカウント（manju.manju.03.28@gmail.com）でログイン後 `/profile` | 4 領域すべて描画、tokens 適用、コンソールに warning 0 |
| 3 | publishState=public のアカウント | success Banner |
| 4 | publishState=member_only のアカウント | info Banner + StatusSummary に mix |
| 5 | publishState=hidden のアカウント | warning Banner |
| 6 | 公開範囲変更を申請 | Dialog 開く → submit → 200 → router.refresh() で pending Banner 表示 |
| 7 | 削除を申請 | 確認入力 → submit → 200 → 削除 button disabled |
| 8 | Sentry / Logs | 新規エラー 0 件 |

> テストアカウント情報: CLAUDE.md memory（admin: manjumoto.daishi@senpai-lab.com / 一般: manju.manju.03.28@gmail.com）

---

## 5. production smoke（main merge 後）

§4 と同等項目を本番で実施。`/profile` の 4 領域可視性、Sentry 無エラー、Cloudflare Logs に 5xx 急増無きこと。

---

## 6. rollback 計画

| 検知 | 対応 |
|------|------|
| Sentry に重大エラー | `bash scripts/cf.sh rollback <prev VERSION_ID> --config apps/web/wrangler.toml --env production` |
| Banner 文言誤り（軽微） | hotfix PR を `feat/task-14-fix-*` で作成 → dev → main |
| Dialog focus trap 不全（a11y 重大） | rollback + Vitest a11y 強化で再 PR |

VERSION_ID は `cf.sh` の deploy 完了出力 / Cloudflare dashboard で確認。

---

## 7. 監視

- Sentry プロジェクト: `apps-web`（既存）
- 確認期間: production deploy 後 24h
- 監視対象 issue: `/profile` route, `_components/*Dialog*` 由来 stack

---

## 8. 完了条件

- staging smoke 8 項目 pass
- production smoke 同等項目 pass
- 24h Sentry 無エラー
- rollback 手順が文書化されており、実行可能な状態
