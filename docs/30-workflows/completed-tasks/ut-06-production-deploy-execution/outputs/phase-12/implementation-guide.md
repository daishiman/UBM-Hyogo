# UT-06 implementation-guide

> 本書は UT-06 (本番デプロイ実行) の Phase 12 実装ガイド。2026-04-27 時点では本番不可逆操作を未実行とし、実行テンプレートと実行前ブロッカーを明示する。

## Part 1: 中学生レベルの説明

### なぜ必要か

本番デプロイは、学校の文化祭で作った案内板を校内だけの下書きから、来場者全員が見る正面玄関に出す作業に近い。下書きなら間違えてもすぐ直せるが、正面玄関に出した後に案内が壊れていると、多くの人が迷う。

だから本番に出す前に、次を必ず確認する。

- 案内板そのものが完成しているか
- 間違えたときに前の案内板へ戻せるか
- 出した後に本当に見えるか
- データを壊さないように控えを取ったか

### 何をするか

UT-06 では、Web 画面、API、D1 データベースを Cloudflare の本番環境へ出す手順を用意する。ただし、この Phase 12 時点では実デプロイ、D1 migration、本番 smoke test は未実行である。

実行者は、まず Phase 4 の事前検証と Phase 10 の承認を終え、Phase 5 で本番デプロイ、Phase 11 で画面・API・D1 の smoke test を行う。結果は `outputs/phase-05/` と `outputs/phase-11/` に実値で記録する。

### 現時点の注意

- `outputs/phase-11/screenshots/capture-pending.png` は実スクリーンショットではなく、未取得を示す placeholder。
- UI コード変更はないため UI 差分検証としての撮影は不要。ただし本番 smoke 証跡として Phase 11 のスクリーンショット取得は必要。
- `apps/web/wrangler.toml` はまだ `pages_build_output_dir = ".next"` を持つ Pages 形式で、OpenNext Workers 本番デプロイの実行前ブロッカー。
- `apps/api` には `/health/db` が未実装のため、AC-4 の API 経由 D1 疎通 smoke は現状では実行できない。

## Part 2: 技術者向け実装ガイド

### 前提条件

| 項目 | 要件 |
| --- | --- |
| ブランチ | `main` に昇格済みの対象 commit |
| 実行環境 | mise Node 24.15.0 / pnpm 10.33.2 |
| Wrangler | package/lockfile の `wrangler` version と一致すること |
| Cloudflare CLI | `wrangler` 直実行は禁止。`bash scripts/cf.sh ...` を使う |
| Secrets | `.env` 実値禁止。`op://` 参照を `scripts/with-env.sh` 経由で注入 |
| 承認 | `outputs/phase-04/production-approval.md` で承認取得済み |

### 実行前ブロッカー

| ID | 内容 | 必須対応 |
| --- | --- | --- |
| B-1 | `apps/web/wrangler.toml` が Pages 形式 | OpenNext Workers 形式へ移行するか、UT-06 の AC を Pages 実行として再定義 |
| B-2 | `apps/api` に `/health/db` がない | D1 binding 型と `GET /health/db` を実装、または AC-4 の実行方法を実装済み endpoint へ変更 |
| B-3 | API `/health` 期待値が docs と実装で異なる | docs を `{ ok: true }` 系へ寄せるか、API 実装を `status: "healthy"` へ寄せる |
| B-4 | CORS preflight smoke に対応する API 実装がない | Web-to-API が必要なら CORS policy を実装・仕様化 |
| B-5 | Phase 11 スクリーンショット未取得 | 本番 URL 確定後に実画像を `outputs/phase-11/screenshots/` へ保存 |

### 型・インターフェース

`/health/db` を実装する場合の最小契約:

```typescript
type ApiEnv = {
  DB: D1Database;
};

type HealthResponse = {
  ok: true;
  foundation: string;
  integrationRuntimeTarget: string;
};

type DbHealthResponse =
  | { ok: true; db: "ok"; check: "SELECT 1" }
  | { ok: false; db: "error"; error: string };
```

### API シグネチャと使用例

| API | 用途 | 期待 |
| --- | --- | --- |
| `GET /health` | API Workers 生存確認 | HTTP 200、現行実装では `ok: true` |
| `GET /health/db` | D1 binding 疎通確認 | HTTP 200 + SELECT 成功、失敗時 HTTP 503 |

```bash
curl -sS https://<api-host>/health
curl -sS https://<api-host>/health/db
```

### 実行コマンド

```bash
# 事前確認
bash scripts/cf.sh --version
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# build gate
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit

# D1 backup
TS=$(date +%Y%m%d-%H%M%S)
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"

# D1 migration
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# Deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# Smoke
curl -sI https://<web-url>
curl -sS https://<api-host>/health
curl -sS https://<api-host>/health/db
```

### エラーハンドリングとエッジケース

| ケース | 対応 |
| --- | --- |
| `cf.sh whoami` 失敗 | 1Password の `op://` 参照、Cloudflare token scope、`scripts/with-env.sh` を確認 |
| D1 backup が空 | 初回 migration 前なら空 export として `d1-backup-evidence.md` に記録し、`restore-empty.sql` 雛形を準備 |
| migration 失敗 | 以降の deploy を停止し、Phase 6 D1 rollback 手順へ遷移 |
| OpenNext deploy 失敗 | 直前 version があれば rollback、初回で version がなければ service disable / route detach を復旧策として記録 |
| API smoke 失敗 | `wrangler tail` で 5 分監視し、`api-response-evidence.md` に body と status を保存 |
| スクリーンショット未取得 | `capture-pending.png` を実証跡として扱わず、Phase 11 を NOT EXECUTED のままにする |

### 設定可能パラメータと定数

| 名前 | 現行値 / 参照 | 備考 |
| --- | --- | --- |
| Web Worker | `ubm-hyogo-web` | `apps/web/wrangler.toml` |
| API Worker | `ubm-hyogo-api` | `apps/api/wrangler.toml` |
| D1 production DB | `ubm-hyogo-db-prod` | database_id は機密ではないが管理粒度改善候補 |
| API health path | `/health` | 現行実装は `ok: true` |
| DB health path | `/health/db` | 未実装。実行前ブロッカー |
| Screenshot dir | `outputs/phase-11/screenshots/` | 本番 smoke 後に実画像を保存 |

### Phase 12 参照

- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-core.md`
