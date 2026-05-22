# Phase 3: アーキテクチャ俯瞰と変更対象俯瞰

## 3.1 影響範囲マップ

```
┌────────────────────────────────────────────────────────────┐
│ GitHub Actions (push: dev)                                 │
│  ├── web-cd / deploy-staging                               │
│  │   └── step: Build web app (OpenNext Workers bundle)     │
│  │        ↓ next build → prerender /_not-found             │
│  │        ↓ getPublicEnv() throws ZodError    ← task-01    │
│  └── backend-ci / deploy-staging                           │
│      └── step: Apply D1 migrations (wrangler-action@v3)    │
│           ↓ CLOUDFLARE_API_TOKEN invalid     ← task-02     │
└────────────────────────────────────────────────────────────┘
```

## 3.2 task-01 変更対象俯瞰

| パス | 種別 | 役割 |
|------|------|------|
| `.github/workflows/web-cd.yml` | 編集 | `Build web app` step に `env:` ブロックで build-time placeholder env を注入（staging / production 双方） |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集（条件付き） | `getPublicEnv` 呼び出しを metadata 関数内に閉じる（既に閉じている場合は no-op） |
| `apps/web/src/lib/__tests__/build-time-env.spec.ts` | 新規 | build-time placeholder env で `getPublicEnv` が成功することを保証する unit test |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | 編集（必要時） | placeholder URL での build-time 動作確認ケース追加 |

placeholder 値の方針:
- `ENVIRONMENT`: GitHub Environment 名と一致（`staging` / `production`）
- `NEXT_PUBLIC_API_BASE_URL`: `wrangler.toml [env.<env>.vars]` と同一値を CI build env に注入（実 URL）。runtime 値の正本は引き続き wrangler.toml。
- `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` / `AUTH_URL`: build-time に `getEnv()` が呼ばれる経路があるかは task-01 仕様書で grep 確認。呼ばれない場合は `getPublicEnv()` 用 2 key のみで十分。

## 3.3 task-02 変更対象俯瞰

| パス / リソース | 種別 | 役割 |
|----------------|------|------|
| Cloudflare dashboard `My Profile → API Tokens` | 再発行（手動） | D1:Edit + Workers Scripts:Edit + Account Settings:Read scope の token 発行 |
| GitHub repo `Settings → Environments → staging` | Secrets 更新 | `CLOUDFLARE_API_TOKEN` の値を新 token に差し替え |
| GitHub repo `Settings → Environments → production` | Secrets 更新 | 同上（production scope の token を別途発行する設計を仕様書で明示） |
| `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/phase-12/implementation-guide.md` | 新規 | rotation 手順 / 検証手順 / runbook |
| `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/runbook.md` | 新規 | failure 時の調査・rollback フロー（後続作業者向け） |

token 設計方針:
- staging / production を分離（1 token / 1 environment 原則）。
- 過剰権限を避け、最小 scope を選定。
- `cf-token-rotation-reminder.yml` workflow との連動を仕様書内で言及。

## 3.4 並列性

- task-01 と task-02 は独立リソース。並列実行可。
- 両 task 完了後に `dev` への動作確認 push（empty commit でも可）で AC-01..06 を検証する。

## 3.5 後続実装プロンプト（03.実装.md）への引き継ぎ

各 task 仕様書（`spec.md` + `phase-12/implementation-guide.md`）には、CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト / 実行コマンド / DoD）をすべて含めること。task-02 は手動操作部分を含むため、CLI 確認コマンドと手動操作の境界を明示する。
