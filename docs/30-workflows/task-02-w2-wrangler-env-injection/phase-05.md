# Phase 05 — 実装ランブック

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 0. 前提

- Node 24.15.0 / pnpm 10.33.2（mise 管理）
- `mise exec -- pnpm install` 実行済み
- task-01 scope-gate-all-screens の gate 通過済み
- task-03 sentry-workers-sdk-unify は本タスク merge 後に着手される（並列の場合 `[vars]` 編集競合に注意）

## 1. ステップ順序

### Step 1: `apps/web/wrangler.toml` 編集

phase-02 §2 の差分を適用する。

```bash
# 編集対象を確認
mise exec -- pnpm --filter @ubm-hyogo/web exec rg '\[vars\]|\[env\..*\.vars\]' apps/web/wrangler.toml
```

編集後の検証:

```bash
# wrangler.toml の構文チェック
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

DoD: AC-1 / AC-9。

### Step 2: `apps/web/.dev.vars.example` 新規作成

phase-02 §3 の内容で新規作成。**実値は書かない**。

```bash
ls -la apps/web/.dev.vars.example  # 存在確認
rg 'op://' apps/web/.dev.vars.example  # secret は op 参照のみ
```

DoD: AC-2。

### Step 3: `apps/web/src/lib/env.ts` 新規作成

phase-02 §4.1 の関数シグネチャ通りに新規作成。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit
```

DoD: AC-3 / AC-4。

### Step 4: `apps/web/src/lib/__tests__/env.test.ts` 新規作成

phase-04 §1.1 の UT-1〜UT-8 を実装。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/env.test.ts
```

DoD: AC-7。

### Step 5: `apps/web/next.config.ts` 最小編集

`NEXT_PUBLIC_*` 公開キー許可リストへの追記のみ。既存 build 設定 / @opennextjs 連携設定は触らない。

```bash
# 編集前後の diff を確認
git diff apps/web/next.config.ts
mise exec -- pnpm --filter @ubm-hyogo/web build
```

DoD: AC-11 / AC-8（build 通過）。

### Step 6: 既存コードの grep & 移行

`127.0.0.1:8888` 焼き込みと `process.env.NEXT_PUBLIC_API_BASE_URL` 直接参照を `getEnv()` 経由に書き換える。

```bash
# 検出
pnpm --filter @ubm-hyogo/web exec rg '127\.0\.0\.1:8888'
pnpm --filter @ubm-hyogo/web exec rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' --files-with-matches | grep -v 'src/lib/env\.ts'

# 検出ファイルごとに `import { getEnv } from "@/lib/env"; const { NEXT_PUBLIC_API_BASE_URL } = getEnv();` に置換
```

検出 0 件まで繰り返し。

DoD: AC-5 / AC-6。

### Step 7: wrangler dev で env 注入実機確認

```bash
bash scripts/cf.sh dev --config apps/web/wrangler.toml
# 起動後、別タブで以下を実行（または Worker ハンドラ内で console.log）
curl -s http://127.0.0.1:3000/api/health  # 例
```

`evidence/wrangler-dev-log.txt` に `ENVIRONMENT=local` / `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787` 等が読めていることを記録（Phase 11）。

### Step 8: build 通過確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build
# build 出力 grep
rg '127\.0\.0\.1:8888' apps/web/.next || echo "OK: 127.0.0.1:8888 not baked-in"
rg '127\.0\.0\.1:8888' apps/web/.open-next || echo "OK"
```

DoD: AC-5 / AC-8 / BO-1。

### Step 9: staging dry-run

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
```

エラーがないことを確認。Cloudflare Secrets 未投入で警告が出る場合は phase-01 §7 のエスカレーションフローへ。

DoD: AC-8。

## 2. CONST_005 必須項目（再掲）

| ファイル | 変更種別 | 関数シグネチャ | 入出力 | テスト | ローカル実行 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/web/wrangler.toml` | M | toml | env binding | wrangler dev / dry-run | `bash scripts/cf.sh dev --config apps/web/wrangler.toml` | AC-1, AC-9 |
| `apps/web/.dev.vars.example` | C | ini | local env キー一覧 | grep で実値含まず | `cp ... && op inject ...` | AC-2 |
| `apps/web/src/lib/env.ts` | C | `EnvSchema` / `getEnv()` / `getPublicEnv()` | Workers env or process.env → `Env` | env.test.ts | `pnpm --filter @ubm-hyogo/web test ...` | AC-3, AC-4 |
| `apps/web/src/lib/__tests__/env.test.ts` | C | Vitest | mock env | 8 cases PASS | `pnpm --filter @ubm-hyogo/web test ...` | AC-7 |
| `apps/web/next.config.ts` | M（最小） | `nextConfig.env` | NEXT_PUBLIC_* 許可リスト | build 通過 | `pnpm --filter @ubm-hyogo/web build` | AC-11, AC-8 |

## 3. ロールバック手順

| 影響範囲 | ロールバック手順 |
| --- | --- |
| `apps/web/wrangler.toml` 構文エラーで wrangler dev / deploy が壊れた | `git checkout HEAD -- apps/web/wrangler.toml` で直前 commit に戻す |
| `env.ts` の zod parse が production runtime で throw 連発 | `getEnv()` を import している箇所を一時的に `process.env` 直接参照に戻し、`env.ts` を `optional` 緩和して再 deploy |
| Cloudflare Secrets 投入忘れで staging deploy が失敗 | `bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging` で投入 → 再 deploy |
| `next.config.ts` の env 許可リスト誤りで build 失敗 | 該当キーを許可リストから外す or 値を空文字フォールバックに変更 |
| `127.0.0.1:8888` 移行で挙動破壊 | 該当 commit を `git revert` し、phase-05 step 6 を再実行 |

## 4. PR 直前チェックリスト

- [ ] `git diff --name-only main...HEAD` が phase-02 §5 の変更ファイル一覧と一致
- [ ] phase-04 §3 の全テストコマンドが PASS
- [ ] grep gate（SM-1〜SM-4）が 0 件
- [ ] staging dry-run が PASS
- [ ] `apps/web/instrumentation.ts` / `[observability]` セクションを触っていない（task-03 owner 範囲）
- [ ] `apps/api/wrangler.toml` を触っていない（本タスク scope out）
- [ ] `outputs/phase-11/evidence/` に wrangler dev env dump / build 出力 grep を保存

## 5. 完了条件

phase-02 §5 全項目の DoD を満たし、phase-04 §2 AC × test mapping が全て PASS。phase-13 で PR 作成 → user 承認後に completed 状態へ遷移。
