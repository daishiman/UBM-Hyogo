# Phase 10: デプロイ手順

## 目的

本 task のデプロイを **local → staging → production** の 3 段階で実施する手順を確定する。CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い、`scripts/cf.sh` ラッパー経由のみで wrangler を実行する。

## 段階 1: local 検証（pre-staging）

```bash
# 1) 依存・cache クリーン
mise exec -- pnpm install
rm -rf apps/web/.open-next apps/web/.next

# 2) 単体テスト
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/sentry-capture.test.ts

# 3) typecheck / lint
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
mise exec -- pnpm --filter @ubm-hyogo/web lint

# 4) build
mise exec -- pnpm --filter @ubm-hyogo/web build

# 5) grep gate G-1 (最重要)
mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'requestIdleCallback' apps/web/.open-next/ \
  && { echo "FAIL: Browser SDK leaked into Workers bundle"; exit 1; } \
  || echo "OK: G-1 passed"

# 6) Workers ランタイムでの起動確認
bash scripts/cf.sh dev --config apps/web/wrangler.toml
# ブラウザで http://localhost:8788/ を開き RSC 200 を確認、Ctrl+C で停止
```

## 段階 2: staging deploy

### 2.1 Secrets 投入（初回のみ）

```bash
# Sentry DSN を 1Password から op run 経由で取得し、Cloudflare Secrets へ
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging
# プロンプトで op:// 参照を貼り付け、または STDIN 経由

# 確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging
# 期待: SENTRY_DSN_WEB が一覧にある
```

> **CLAUDE.md 引用**: 「`scripts/cf.sh` の役割: 1. `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` 等を 1Password から動的注入（実値は環境変数として揮発的に渡るのみ・ファイルやログには残らない）」「**禁止事項**: `wrangler login` でローカル OAuth トークンを保持しない。`.env` の op 参照に一本化する」

### 2.2 `[vars]` 確認（task-02 で配置済み）

```bash
# wrangler.toml staging env section に以下が存在することを確認
mise exec -- pnpm --filter @ubm-hyogo/web exec rg 'NEXT_PUBLIC_SENTRY_DSN' apps/web/wrangler.toml
# 期待: [env.staging.vars] / [env.production.vars] に出現
```

### 2.3 deploy dry-run

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
# bundle 出力を確認、エラーなく完了すること
```

### 2.4 deploy 実行

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
# 完了後、Worker version ID をメモ（rollback 用）
```

### 2.5 staging smoke（簡易）

```bash
# RSC 200 を確認（task-05 の本格 smoke は別 task）
curl -s -o /dev/null -w "%{http_code}\n" https://<staging-domain>/
curl -s -o /dev/null -w "%{http_code}\n" https://<staging-domain>/members
# 期待: 200 / 200
```

### 2.6 Sentry dashboard 確認（補助 evidence）

- Sentry プロジェクト → Issues
- staging environment フィルタで意図的 throw 経由の event が `runtime: server` / `runtime: browser` の双方で 1 件以上届くことを確認（screenshot を Phase 11 evidence に保存）

## 段階 3: production deploy

```bash
# secrets（初回のみ）
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env production

# dry-run → deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# Worker version ID をメモ
```

> production deploy は task-05 staging smoke 完了後・task-04 / 05 の merge 完了後に実施することを推奨。本 task 単独 merge では staging まで。

## rollback 手順

```bash
# staging
bash scripts/cf.sh rollback <STAGING_VERSION_ID> --config apps/web/wrangler.toml --env staging

# production
bash scripts/cf.sh rollback <PROD_VERSION_ID> --config apps/web/wrangler.toml --env production
```

DSN は version をまたいで Secrets に残るため再投入不要。`[vars]` 変更を伴う rollback の場合は `wrangler.toml` の git revert を併用。

## 実行タスク（チェックリスト）

- [ ] 段階 1 の 6 step を全て PASS
- [ ] G-1 grep gate が 0 件
- [ ] staging Secrets `SENTRY_DSN_WEB` 投入完了
- [ ] staging deploy dry-run 成功
- [ ] staging deploy 成功 + RSC 200 + Sentry dashboard event 受信
- [ ] Worker version ID を記録（rollback 用）
- [ ] production deploy は task-04 / task-05 完了後に実施

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク §7 / §9、Phase 6 実装順序、Phase 4 env 表 |
| 出力 | 3 段階 deploy runbook、rollback 手順 |

## 参照資料

- `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「シークレット管理」
- 元タスク §7「DSN / Secrets 取扱い」, §9「ローカル実行・検証コマンド」
- `scripts/cf.sh`（実装本体）

## 成果物

- 本 phase-10.md（3 段階 runbook）
- `outputs/phase-10/main.md`（executed 時のみ）

## 完了条件（DoD）

- [ ] local / staging / production の 3 段階手順が `scripts/cf.sh` 経由で記述
- [ ] Secrets 投入と `[vars]` 確認が分離して記述
- [ ] dry-run と deploy が分離して記述
- [ ] rollback コマンドが記述
- [ ] CLAUDE.md「wrangler 直接実行禁止」を遵守

## 統合テスト連携

- local 段階の typecheck / lint / test / build / grep gate は Phase 11 の canonical evidence 5 点に接続する。
- staging / production deploy は user approval 後の runtime evidence であり、`implemented-local` close-out では実行済み PASS と記録しない。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 10
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
