# Phase 8 成果物: 設定 DRY 化レポート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

---

## 1. Before / After 比較

### 1-1. branch 記法統一

| 観点 | Before | After | 理由 |
| --- | --- | --- | --- |
| staging branch 名 | `develop` / `development` が混在 | `dev` に統一 | `CLAUDE.md` の branch strategy と整合させる |
| workflow trigger | `branches: [develop]` 記述が存在 | `branches: [dev]` に統一 | AC-2 の PASS 条件を満たすため |
| PR 先の記述 | `feature/* → develop → main` と `feature/* → dev → main` が混在 | `feature/* → dev → main` に統一 | 正本仕様（deployment-branch-strategy）に準拠 |

### 1-2. runtime secret / deploy secret の分離

| 観点 | Before | After | 理由 |
| --- | --- | --- | --- |
| Cloudflare Workers へのシークレット渡し方 | `CLOUDFLARE_API_TOKEN` を runtime binding として記述 | deploy secret（GitHub Secrets）と runtime secret（Cloudflare Secrets）を明示分離 | AC-1 の一意配置要件 |
| GitHub Actions の `env:` 節 | runtime 用 secret と deploy 用 secret が同じブロックに混在 | deploy secret のみを `env:` に配置し runtime secret は Cloudflare Secrets binding のみ | 混線防止 |
| ドキュメントの secret 区分表 | 区分なしで列挙 | runtime / deploy / public の3列に分離して表記 | 読み手が一意に判断できるようにする |

### 1-3. secret 配置表現の統一

| 観点 | Before | After | 理由 |
| --- | --- | --- | --- |
| Cloudflare secret の記述方法 | `wrangler secret put <KEY>` と `wrangler secret:bulk` が混在 | `wrangler secret put <KEY>` に統一（bulk は例外として注記） | 手順の一意化 |
| GitHub Secret の登録表現 | `Settings > Secrets > Actions` と `GitHub Secrets UI` が混在 | `GitHub Secrets (Actions)` に統一 | 用語揺れ防止 |
| 1Password 参照方法 | `1Password CLI` / `op run` / `1Password Environments` が混在 | `1Password Environments` を正本と明記し、取得コマンドは `op run --` に統一 | AC-3 の正本一意化 |

---

## 2. 共通化パターン一覧

| パターン名 | 対象 | 共通化の内容 |
| --- | --- | --- |
| branch-name-pattern | 全 Phase のドキュメント・workflow | staging = `dev`、production = `main` の二値のみ許容 |
| secret-placement-table | Phase 1, 3, 5, 8 の配置表 | runtime / deploy / public の3列フォーマットを統一 |
| deploy-path-pattern | web deploy / api deploy の記述 | `apps/web` と `apps/api` をそれぞれ独立 job として記述 |
| local-canonical-pattern | 環境変数取得手順 | `op run --` を前置することを全箇所で統一 |
| runbook-step-format | rotation / revoke / rollback runbook | ステップ番号・コマンド・期待結果・rollback 先の4項目を必須とする |
| 4条件フォーマット | 多角的チェック観点 | 価値性 / 実現性 / 整合性 / 運用性 の順序と表現を全 Phase 統一 |

---

## 3. 削除対象一覧

### 3-1. legacy assumption（過去設計の残留）

| 記述内容 | 削除理由 |
| --- | --- |
| Cloudflare Pages を前提とした deploy 記述 | 本タスクは Workers + `@opennextjs/cloudflare` を正とするため |
| `develop` branch への push trigger | branch strategy から `dev` に統一済みのため不要 |
| GAS Prototype の認証フロー参照 | `CLAUDE.md` の「GAS prototype は本番バックエンド仕様に昇格させない」に違反するため |

### 3-2. scope 外サービスの先行導入

| 記述内容 | 削除理由 |
| --- | --- |
| Sentry / Datadog 等の有料監視サービス前提の secret 定義 | MVP の無料構成スコープ外 |
| SendGrid / Postmark 等のメール配信サービスの secret 定義 | MVP では Magic Link に限定するため |
| Stripe 等の決済サービスの環境変数記述 | 現フェーズのスコープ外 |

### 3-3. 実値前提の記述

| 記述内容 | 削除理由 |
| --- | --- |
| secret のプレースホルダー以外の具体値 | 実値はリポジトリにコミットしない（CLAUDE.md 不変条件） |
| Cloudflare Account ID の実値記述 | `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` プレースホルダーに置換 |
| Google OAuth Client ID の実値記述 | Cloudflare Secrets binding のプレースホルダーに置換 |

---

## 4. 残存する重複と許容理由

| 重複箇所 | 残存理由 | Phase 12 での判断 |
| --- | --- | --- |
| secret 種別の説明文が Phase 1 と Phase 3 の両方に存在 | 各 Phase が独立して参照されるため、文脈上の冗長性が可読性に寄与する | 統一するか inline 参照に変更するかを Phase 12 で判断 |
| runbook の前置き文（「本 runbook は実環境操作を伴う」等）が各 runbook に繰り返し存在 | 各 runbook が単独で読まれることを想定しているため | 共通 header ファイルへの切り出しを Phase 12 で検討 |
| deploy 先 URL のプレースホルダーが workflow と runbook の両方に記載 | workflow は実行時参照、runbook は手順確認時参照と用途が異なる | 許容（DRY より可読性優先） |

---

## 5. Phase 9（品質保証）への引き継ぎ事項

### 確定した共通表現

| 項目 | 統一表現 |
| --- | --- |
| staging branch | `dev` |
| production branch | `main` |
| runtime secret 配置先 | Cloudflare Secrets |
| deploy secret 配置先 | GitHub Secrets (Actions) |
| public variable 配置先 | GitHub Variables |
| local canonical | 1Password Environments |
| local コマンド | `op run -- <command>` |
| deploy job 分離単位 | `apps/web` / `apps/api` 別 job |

### Phase 9 で確認すべき項目

| 優先 | 確認内容 | 根拠 AC |
| --- | --- | --- |
| 高 | secret 名が `ALL_CAPS_SNAKE_CASE` に統一されているか | AC-1 |
| 高 | workflow の branch trigger が `dev` / `main` のみか | AC-2 |
| 高 | 実値が一切記述されていないか | AC-3 |
| 高 | `apps/web` と `apps/api` の deploy job が分離されているか | AC-4 |
| 中 | runbook に rotation / revoke / rollback の3手順が揃っているか | AC-5 |
| 中 | 削除対象（legacy / scope 外 / 実値）がすべて除去されているか | 全 AC |
| 低 | 残存重複が許容理由とともに記録されているか | 品質保証 |

### ブロック条件

本 Phase の成果物（本ファイル）が存在することが、Phase 9 開始の前提条件。

---

## 参照資料

| 種別 | パス |
| --- | --- |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` |
| branch 戦略 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` |
| secrets 管理 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| 環境変数 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` |
| Phase 12 同期 | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` |
