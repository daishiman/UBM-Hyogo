# Phase 5: 実装ランブック

> 本ランブックは後続実行サイクル（別チャット / 別 PR）で G1〜G5 を順次通過させる際の手順書。本仕様書作成サイクルでは実行しない。

## 0. 事前確認

```bash
# Node / pnpm
mise exec -- node -v   # v24.15.0
mise exec -- pnpm -v   # 10.33.2

# git 状態
git status --short
git log --oneline -3

# G0 preflight: runtime evidence の前提実装と canonical path を確認
{
  test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-03-w2-par-sentry-workers-sdk-unify.md
  test -f docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-02-w2-par-wrangler-env-injection.md
  test -f apps/web/src/lib/env.ts
  test -f apps/web/wrangler.toml
  test -f apps/web/.dev.vars.example
  test -f scripts/cf.sh
  test -f apps/web/src/instrumentation.ts
  test -f apps/web/src/instrumentation-client.ts
  test -f apps/web/src/lib/sentry/capture.ts
} 2>&1 | tee outputs/phase-11/evidence/preflight-g0.log
```

G0 が FAIL の場合は G1 へ進まない。親 task-03 の実装ファイルが現 worktree に存在しない場合、状態は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` のまま維持し、親 task-03 へ regression として戻す。

## Step 1: env schema 反映（FR-1）

```bash
# 既存 schema 確認
rg -n 'SENTRY_DSN' apps/web/src/lib/env.ts
```

未反映の場合のみ phase-02 §2 の差分を Edit で追加。実装済みなら no-op verification として記録。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/__tests__/env.test.ts
```

## Step 2: wrangler.toml vars 追加（FR-2）

```bash
rg -n 'SENTRY_ENVIRONMENT|NEXT_PUBLIC_SENTRY' apps/web/wrangler.toml
```

未反映なら phase-02 §3 の差分を Edit で追加。

## Step 3: `.dev.vars.example` 整備（NFR-1）

`apps/web/.dev.vars.example` に以下を追記（実値禁止）:

```
SENTRY_DSN_WEB=op://UBM-Hyogo/Sentry Web DSN (local)/dsn
NEXT_PUBLIC_SENTRY_DSN=op://UBM-Hyogo/Sentry Web DSN (local)/public_dsn
```

## Step 4: ローカル品質ゲート

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm --filter @ubm-hyogo/web run build:cloudflare
{
  if rg -n 'requestIdleCallback' apps/web/.open-next/worker.js; then
    echo 'FAIL: requestIdleCallback matches found in worker.js'
    exit 1
  else
    echo 'PASS: requestIdleCallback 0 matches in worker.js'
  fi
  if rg -n '@sentry/nextjs' apps/web/.open-next/worker.js; then
    echo 'FAIL: @sentry/nextjs matches found in worker.js'
    exit 1
  else
    echo 'PASS: @sentry/nextjs 0 matches in worker.js'
  fi
} | tee outputs/phase-11/evidence/grep-gate-runtime.log
```

各ステップが PASS することを確認した上で **G1 承認待ち** に入る。

## Step 5: G1（secret 投入承認）

owner（user）の明示承認を取得後、staging の `SENTRY_DSN_WEB` を投入する。production secret 投入と production deploy は本タスクの scope out とし、別 gate / 別 issue で扱う。

G1 へ進む前に、1Password 正本の存在を確認する。vault/item が存在しない場合は secret put を実行せず、`UT-Sentry-Provisioning` を先に解消する。

```bash
op vault list --format json
op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo --fields label=dsn --reveal=false
op item get 'Sentry Web DSN (staging)' --vault UBM-Hyogo --fields label=public_dsn --reveal=false
```

```bash
# 1Password 経由で値を渡す（実値はターミナル history / log に残さない）
op read 'op://UBM-Hyogo/Sentry Web DSN (staging)/dsn' \
  | bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging

bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging \
  | tee outputs/phase-11/evidence/secret-list-staging.log
```

## Step 6: G2（staging deploy 承認）

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  2>&1 | tee outputs/phase-11/evidence/deploy-staging.log
```

deploy 完了後、version id を記録し 30 秒待機。

## Step 7: G3（curl + Sentry event 観測承認）

```bash
STAGING_URL="https://<staging-host>"  # phase-02 §5 で確定
{
  echo "## / status"
  curl -sSf -o /dev/null -w '%{http_code}\n' "$STAGING_URL/"
  echo "## /members status"
  curl -sSf -o /dev/null -w '%{http_code}\n' "$STAGING_URL/members"
} | tee outputs/phase-11/evidence/curl-staging.log
```

両方とも 200 であることを確認。

その後:

1. server event 発火: G0 で既存 Sentry init / capture 実装と安全な throw 経路が確認できた場合のみ実行。未整備なら runtime evidence へ進まず、親 task-03 に regression として戻す
2. browser event 発火: ブラウザ DevTools で `throw new Error('staging-smoke-' + Date.now())`
3. Sentry dashboard を `environment:staging` + 当該 release で filter し、server / browser 各 1 件以上を確認
4. screenshot を `outputs/phase-11/evidence/sentry-staging-{server,browser}-event.png` に保存（DSN を画面に映さない）

## Step 8: G4（grep gate 再走承認）

`outputs/phase-11/evidence/grep-gate-runtime.log` の中身が以下を満たす:

- `requestIdleCallback`: 0 件
- `@sentry/nextjs`: 0 件

違反した場合は親 task-03 に regression として戻し、本タスクは保留。

## Step 9: G5（状態昇格 + commit/PR 承認）

owner 承認後:

1. `task-03-w2-par-sentry-workers-sdk-unify.md` 冒頭メタ「状態」を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_BOUNDARY_SYNCED_RUNTIME_VERIFIED` に Edit
2. `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` に runtime evidence セクション追記
3. `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` 更新行追加
4. Phase 12 タスクをすべて消化（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）
5. Phase 13 で commit → push → PR 作成

## DoD（実装ランブック完了条件）

- [ ] env schema 5 キーが parse 通過 / 不正値 reject 動作する単体テスト pass
- [ ] wrangler.toml staging / production vars 追加完了
- [ ] `.dev.vars.example` op 参照のみ追記完了
- [ ] secret list 出力に DSN value が現れない（name のみ）
- [ ] staging deploy 成功 / version id 取得
- [ ] `/` / `/members` curl が 200
- [ ] Sentry server / browser event 各 1 件以上 dashboard で確認
- [ ] grep gate `requestIdleCallback` / `@sentry/nextjs` 共に 0 件
- [ ] 親 task-03 メタ「状態」が VERIFIED に昇格
- [ ] 一時 throw route が残置されていない（`rg 'force_error' apps/web/src` が 0 件）
