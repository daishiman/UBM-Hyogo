# lessons-learned: 04-serial-cicd-secrets-and-environment-sync（2026-04-26）

## 概要

タスク `04-serial-cicd-secrets-and-environment-sync` の実装で得た知見。
Cloudflare Pages → Workers への移行、GitHub Secrets / Variables の2層管理設計、CI/CD パイプライン分離を扱う。

---

## L-CICD-001: Cloudflare Pages は Workers に統合された

**事象**: `@opennextjs/cloudflare` の採用により Next.js アプリは Cloudflare Pages ではなく Cloudflare Workers へデプロイされる。

**影響**:
- `wrangler pages deployment rollback` → `wrangler rollback --name <worker-name>` に変更
- `CLOUDFLARE_PAGES_PROJECT` Variable は不要。代わりに Worker 名を Variable で管理する
- GitHub Actions の deploy step は `wrangler-action@v3` を引き続き使用するが `--project-name` ではなく Worker の `wrangler.toml` ベースで動作する

**適用**: デプロイ仕様書更新時・CD ワークフロー作成時は必ず Workers 経路で記載する。

---

## L-CICD-002: GitHub Secrets と Variables の2層分離が必須

**事象**: `CLOUDFLARE_ACCOUNT_ID` は非機密であるため、GitHub Variables（非暗号化）で管理するのが標準。暗号化 Secrets に入れる必要はない。

**ルール**:
| 種別 | 管理先 | 例 |
| ---- | ------ | -- |
| 機密（API Token / 秘密鍵） | GitHub Environment Secret | `CLOUDFLARE_API_TOKEN` |
| 非機密（アカウントID / Worker名） | GitHub Variables | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_WORKER_NAME_WEB` |

**Why**: Secrets は値の参照が不可能でローテーション管理が煩雑になる。Variables は値の確認・変更が容易で非機密データに適している。

---

## L-CICD-003: web-cd.yml と backend-deploy.yml の分離設計

**事象**: 以前は `web-cd.yml` / `backend-ci.yml` が混在していたが、今回から `web-cd.yml`（フロントエンド）と `backend-deploy.yml`（API）に明確に分離。

**原則**:
- `apps/web/**` の変更 → `web-cd.yml` トリガー
- `apps/api/**` の変更 → `backend-deploy.yml` トリガー
- `packages/**` / `pnpm-lock.yaml` など共有依存変更は両 CD に影響確認が必要

**Why**: 単一 CD ファイルでは変更範囲が把握しにくく、デプロイ先の独立性が失われる。

---

## L-CICD-004: CI 最小ゲートはカバレッジ非必須

**事象**: CI の最小ゲートは `lint / typecheck / build` の3つ。カバレッジ 80% 閾値は初期 CI に含めず、別タスクとして追加する。

**Why**: monorepo 初期フェーズではテストスイートが未整備であることが多く、カバレッジゲートが CI を常時ブロックする問題が起きやすい。テスト基盤整備後に追加する段階的アプローチが安全。

---

## L-CICD-005: PR プレビュー環境は現行標準外

**事象**: Cloudflare Pages 時代は PR ごとにプレビュー URL が自動生成されていたが、Workers 移行後は現時点の標準経路ではない。

**現行品質確認手段**: `ci.yml` の CI チェックと branch protection ルールで代替する。

**適用**: デプロイ仕様書でプレビュー URL の自動生成に言及しない。
