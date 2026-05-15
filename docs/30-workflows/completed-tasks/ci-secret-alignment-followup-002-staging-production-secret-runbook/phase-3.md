# Phase 3: runbook 章立て・差分設計

## 目的

既存 `secret-provisioning.md`（`staging-runtime-smoke` 用）を canonical template として再利用し、`staging` / `production` 用 runbook の章立てと差分を確定する。

## 7 章立て（canonical）

| # | 章 | staging / production での内容差分 |
|---|----|---------------------------------|
| 1 | 目的 | 対象 environment 名と参照 workflow (`web-cd.yml` の `deploy-staging` / `deploy-production` job) を明示 |
| 2 | 必要 secret 一覧 | `CLOUDFLARE_API_TOKEN` 1 件のみ。`op://UBM-Hyogo/Cloudflare API Token (<env>)/credential` 参照を記載 |
| 3 | 投入手順 | `gh secret set CLOUDFLARE_API_TOKEN --env <env>` を先頭スペース付き / op パイプ正規経路で記述 |
| 4 | 投入確認 | `gh api repos/daishiman/UBM-Hyogo/environments/<env>/secrets --jq '.secrets[].name'` の期待出力（1 行: `CLOUDFLARE_API_TOKEN`） |
| 5 | 動作確認 | `web-cd.yml` は push trigger のため、`dev` / `main` push 後に `gh run list --workflow web-cd.yml --branch <branch>` と `gh run view` で deploy job を確認 |
| 6 | ローテーション運用 | Cloudflare ダッシュボードで token rotate → 1Password 更新 → `gh secret set` 上書き → 動作確認の順序 |
| 7 | 禁止事項 | 実値記述禁止 / commit message 禁止 / AI エージェントへの実値投入依頼禁止 / `wrangler login` の OAuth 保持禁止 / terminal scrollback 消去 |

## staging / production 共通方針

- `staging-runtime-smoke` 用既存 runbook と並立構成にし、冒頭で「本 runbook は `web-cd / deploy-<env>` 用」と明示して混同を防ぐ
- 章立て・段落順序・コマンド表示形式（先頭スペース付き）を template と同一にする
- 1Password CLI 正規経路（`op read ... | gh secret set CLOUDFLARE_API_TOKEN --env <env>`）を推奨とし、prompt 経路は user-only fallback として記述

## staging / production 固有差分

| 項目 | staging | production |
|------|---------|-----------|
| 参照 workflow | `web-cd.yml` `deploy-staging` job | `web-cd.yml` `deploy-production` job |
| ブランチ trigger | `dev` push / `gh workflow run --ref dev` | `main` push / `dev → main` PR merge |
| 1Password Item | `Cloudflare API Token (staging)` | `Cloudflare API Token (production)` |
| token scope | Workers Scripts:Edit / Pages:Edit / Account:Read（staging account 限定） | 同上（production account 限定） |
| rotation 影響 | staging deploy のみ停止 | production deploy 停止 = service 影響あり。事前周知必須 |
| 動作確認順序 | rotation 後即時 staging deploy で検証 | rotation 後まず staging で同形式 token 検証 → 問題なければ production rotate |

## アーキテクチャ図（runbook ファミリ）

```
docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/
├── secret-provisioning.md              # 既存（staging-runtime-smoke 用、5 secret）
├── staging-secret-provisioning.md      # 新規（web-cd staging 用、1 secret）
└── production-secret-provisioning.md   # 新規（web-cd production 用、1 secret）
```

3 ファイル並立。先頭の `# H1 タイトル` と「## 目的」章で対象 environment と参照 workflow を明示することで取り違えを防ぐ。

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 3 |
| 状態 | completed |

## 実行タスク

- runbook 章立てと staging / production 差分を設計する。

## 参照資料

- `runbooks/secret-provisioning.md`

## 成果物/実行手順

- 7章構成と差分表。

## 統合テスト連携

- Phase 11 の G1 章立て diff で検証する。

- 章立て 7 章が確定している
- staging / production 固有差分が表形式で列挙されている
- 3 ファイル並立構成が確定し、混同防止策が定義されている
