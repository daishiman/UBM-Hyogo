# Phase 8: 運用・rotation 設計

## 目的

staging / production deploy token の安全な rotation 運用を定義する。

## rotation cadence

| trigger | 頻度 | 担当 | 検証 |
|---------|------|------|------|
| 定期 | 90 日ごと | 運用担当 | staging で同形式 token 検証 → production |
| 漏洩疑い | 即時 | 検出者 → ユーザー escalate | revoke 後 staging / production の両方で deploy 再実行 |
| Cloudflare account 変更 | 都度 | ユーザー指示 | scope と account 範囲を再設定 |

## rotation 正規順序（再掲）

1. Cloudflare で新 token 発行（旧 token は **revoke しない**）
2. 1Password Item を新値に更新
3. `op read ... | gh secret set CLOUDFLARE_API_TOKEN --env <env>` で GitHub 側を上書き
4. 次回 `dev` / `main` push 後の `web-cd.yml` run で deploy 完了を確認
5. PASS 後に旧 token を Cloudflare で revoke

> production token は **staging で同形式 token を先行 rotation して deploy PASS** を確認してから実施する。

## 新規参画者オンボーディング

| step | アクション | 参照 |
|------|----------|------|
| 1 | 1Password Vault `UBM-Hyogo` への招待 | ユーザー実施 |
| 2 | GitHub repo admin 権限付与（Environment Secret 投入に必要） | ユーザー実施 |
| 3 | `op signin` / `gh auth login` 完了 | 担当者 |
| 4 | staging runbook を読み、`gh api .../environments/staging/secrets` で現状確認 | 担当者 |
| 5 | rotation を staging で 1 回実施し、動作確認 | 担当者 |
| 6 | production rotation は ユーザー承認後に実施 | 担当者 + ユーザー |

## 監視・通知

- `web-cd.yml` の `deploy-staging` / `deploy-production` job 失敗は GitHub Actions の通知設定で検知する（本タスクで新規通知設定は追加しない）
- token expiry / revoke 通知は Cloudflare ダッシュボード側の機能に依存（本タスクのスコープ外）
- 別途、token expiry monitoring を runbook 化する場合は別 task として切り出す（CONST_007 例外扱い）

## ドキュメント保守

| 更新トリガ | 更新対象 | 担当 |
|-----------|---------|------|
| Cloudflare API Token の scope 変更 | runbook 章 2 (token scope セクション) | 担当者 |
| `web-cd.yml` の job 名 / environment 名変更 | runbook 章 1 / 章 5 | 担当者 |
| 1Password Vault / Item 名変更 | runbook 章 2 / 章 3 / 章 6 | 担当者 |
| GitHub Environment 追加（例: `preview`） | 新規 runbook を本仕様の章立てに従って追加 | 担当者 |

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 8 |
| 状態 | completed |

## 実行タスク

- rotation cadence と正規順序を定義する。

## 参照資料

- `deployment-secrets-management.md`

## 成果物/実行手順

- rotation 運用ルール。

## 統合テスト連携

- runtime deploy 実行は user-gated。文書整合のみ Phase 11 で確認する。

- rotation cadence と正規順序が定義されている
- オンボーディング手順が定義されている
- ドキュメント保守トリガが定義されている
