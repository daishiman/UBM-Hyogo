# Phase 5: 実装ガイド（章ごとの文面方針）

## 対象成果物

| ファイル | 種別 | 行数目安 |
|---------|------|---------|
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/staging-secret-provisioning.md` | 新規 | 80-120 |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/production-secret-provisioning.md` | 新規 | 80-120 |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md` | 編集（2 行追記） | +2 |

> **completed-tasks 配下への追記方針**: 親 `index.md` の編集は In-scope 表に runbook 2 本を参照する 2 行を追加するのみ。spec 本文の改変ではない。

## 章ごとの文面方針

### 章 1: 目的

#### staging
```markdown
# `staging` Environment Secret Provisioning (web-cd deploy)

## 目的

GitHub Environment `staging` に Cloudflare Workers staging へデプロイするために必要な `CLOUDFLARE_API_TOKEN` を投入する。本 runbook は `.github/workflows/web-cd.yml` の `deploy-staging` job が参照する secret の canonical provisioning 経路を提供する。**実値はこのドキュメントに書かない**。

> 注: `staging-runtime-smoke` Environment（runtime smoke 用 5 secret）とは別 Environment。混同しないこと。`staging-runtime-smoke` 用の provisioning は `secret-provisioning.md` を参照。
```

#### production
```markdown
# `production` Environment Secret Provisioning (web-cd deploy)

## 目的

GitHub Environment `production` に Cloudflare Workers production へデプロイするために必要な `CLOUDFLARE_API_TOKEN` を投入する。本 runbook は `.github/workflows/web-cd.yml` の `deploy-production` job が参照する secret の canonical provisioning 経路を提供する。**実値はこのドキュメントに書かない**。

> 注: production deploy は service 影響を伴う。rotation 時は staging で同形式 token を事前検証してから実施する。
```

### 章 2: 必要 secret 一覧

| secret 名 | 取得元（参照のみ） | 形式（実値ではない） |
|-----------|------------------|---------------------|
| `CLOUDFLARE_API_TOKEN` | `op://UBM-Hyogo/Cloudflare API Token (<env>)/credential` | GitHub には値を表示しない。実値形式は記述しない |

token scope（Cloudflare 側）:
- `Workers Scripts:Edit`（apps/web / apps/api deploy 用）
- `Pages:Edit`（OpenNext Workers bundle deploy 用）
- `Account:Read`（account 自体への read 権限）
- account 範囲は当該 environment の Cloudflare account に限定する

非機密 var（本 Environment Secret 対象外）:
- `vars.CLOUDFLARE_ACCOUNT_ID` は GitHub Variables 側で管理。**Environment Secret に投入してはいけない**。

### 章 3: 投入手順

正規経路（op パイプ）:
```bash
op read 'op://UBM-Hyogo/Cloudflare API Token (<env>)/credential' | \
  gh secret set CLOUDFLARE_API_TOKEN --env <env>
```

fallback（prompt 経路、op 未整備時のみ）:
```bash
# HISTCONTROL=ignorespace を有効化し、コマンド先頭をスペースで開始すること
 gh secret set CLOUDFLARE_API_TOKEN --env <env>
```

terminal scrollback 消去:
```bash
clear
printf '\033[3J'
```

### 章 4: 投入確認

```bash
gh api repos/daishiman/UBM-Hyogo/environments/<env>/secrets \
  --jq '.secrets[].name' | sort
# 期待出力 (1 行):
# CLOUDFLARE_API_TOKEN
```

### 章 5: 動作確認

staging:
```bash
# web-cd.yml は push trigger のため、dev push 後の run を確認する
gh run list --workflow web-cd.yml --branch dev --limit 5
gh run view <run-id> --log-failed
# 期待: Verify CF token is present / Deploy to Cloudflare Workers (staging) が completed
```

production:
```bash
# 通常は dev → main の PR merge で自動実行される
# web-cd.yml は push trigger のため、main push 後の run を確認する
gh run list --workflow web-cd.yml --branch main --limit 5
gh run view <run-id> --log-failed
# 期待: Verify CF token is present / Deploy to Cloudflare Workers (production) が completed
```

### 章 6: ローテーション運用

順序（**この順を守る**）:
1. Cloudflare ダッシュボードで対象 environment の API Token を新規発行（旧 token はまだ revoke しない）
2. 1Password の `Cloudflare API Token (<env>)` Item の credential フィールドを新値に更新
3. `op read ... | gh secret set CLOUDFLARE_API_TOKEN --env <env>` で GitHub 側を上書き
4. 次回 `dev` / `main` push 後の `web-cd.yml` run で deploy job を確認
5. PASS 確認後に Cloudflare で旧 token を revoke

頻度: 定期 90 日 / 漏洩疑い時即時。production の rotation は staging で同形式 token の動作確認後に実施する。

### 章 7: 禁止事項

- 実 token 値 / API key / OAuth token / JWT 値をこのドキュメント・commit message・PR 本文・Slack・Issue・AI エージェントへの prompt に**一切記述しない**
- `wrangler login` のローカル OAuth トークン（`~/Library/Preferences/.wrangler/config/default.toml`）を保持しない。op 参照に一本化する
- `gh secret set` の値を heredoc / 引数で直接渡さない（履歴に残るため）
- 本 environment では `CLOUDFLARE_API_TOKEN` 以外の secret を投入しない（特に `staging-runtime-smoke` 用 5 secret を `staging` に誤投入しないこと）
- terminal scrollback / `script(1)` ログ / tmux capture-pane の残骸を確認し、token 文字列が残っていないことを `clear` 後に確認する

## 親 `index.md` への追記内容

In-scope セクションに以下 2 行を追加する（既存の `secret-provisioning.md` 参照行の直後）:

```markdown
- [`runbooks/staging-secret-provisioning.md`](./runbooks/staging-secret-provisioning.md) — `web-cd / deploy-staging` 用 `CLOUDFLARE_API_TOKEN` provisioning
- [`runbooks/production-secret-provisioning.md`](./runbooks/production-secret-provisioning.md) — `web-cd / deploy-production` 用 `CLOUDFLARE_API_TOKEN` provisioning
```

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 5 |
| 状態 | completed |

## 実行タスク

- staging / production runbook 本文と親 index 追記方針を定義する。

## 参照資料

- `runbooks/secret-provisioning.md`
- `gh secret set --help`

## 成果物/実行手順

- 実装ガイド本文。

## 統合テスト連携

- Phase 11 の G1 から G6 で実文書を検証する。

- staging / production 用 runbook の各章テキスト方針が確定している
- 文面 template が実装サイクルでそのまま流用できる粒度になっている
- 親 `index.md` への追記行が確定している
