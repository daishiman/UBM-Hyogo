# Phase 5: 実装ランブック — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 5 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

real Workers + real D1 binding 経路で `/`, `/members`, `/members/[id]`, `/register` の 4 route を local / staging 両方で smoke 実行するための **コマンド粒度の runbook** を確定する。本仕様書作成では実行しない（実行は Phase 11 user approval gate 経由）。

> **重要原則（CLAUDE.md / scripts/cf.sh の運用）**: `wrangler` は直接呼ばない。すべて `bash scripts/cf.sh ...` 経由で実行する。`.env` の中身を `cat` / `Read` しない。

## 前提

- `mise install` 済み（Node 24 / pnpm 10）
- `mise exec -- pnpm install` 済み
- `.env` に 1Password 参照（`op://...`）が設定済み
- `apps/api/wrangler.toml` の D1 binding `DB`（dev / staging）が migration apply 済み
- `apps/web/wrangler.toml` の `[env.staging.vars] PUBLIC_API_BASE_URL` が staging API URL を指している（現状 `https://ubm-hyogo-api-staging.daishimanju.workers.dev`）
- 本タスクの作業ディレクトリ = ワークツリー root（`.worktrees/task-...`）

## コード変更（実行時に必要なら適用）

本仕様書作成では **コード変更は行わない**。Phase 11 実行時に以下の差分が必要と判明した場合、別 PR / 別タスクで分離する。

### A. `apps/web/wrangler.toml` の local dev 用 vars 追記候補

local smoke では `wrangler dev` 起動時に `PUBLIC_API_BASE_URL` を環境変数で渡す。`wrangler.toml` には記載しない方針（local だけ env で上書き）。

```bash
# 起動時に env 注入
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
  bash scripts/cf.sh dev --config apps/web/wrangler.toml --port 8788
```

### B. `apps/api/wrangler.toml` の D1 binding 確認

現状 `[[d1_databases]]` に `DB` (production) / `[[env.staging.d1_databases]]` (staging) が設定済み。**変更不要**。実行前に migration apply 状態を確認するのみ。

### C. health check route 追加（任意 / scope out）

apps/api 側に `GET /health` が無い場合、smoke の事前確認を簡略化するため追加検討余地あり。ただし本タスクでは scope out（追加が必要なら別 followup task）。

## 実行順序（高レベル）

```
[STEP 0]  事前確認
[STEP 1]  apps/api を local 起動（D1 binding を実体接続）
[STEP 2]  apps/web を local 起動（PUBLIC_API_BASE_URL=http://127.0.0.1:8787）
[STEP 3]  local curl matrix 5 case 実行 → outputs/phase-11/evidence/local-curl.log
[STEP 4]  local 4 route screenshot → outputs/phase-11/evidence/local-*.png
[STEP 5]  不変条件 #5 検証（rg）→ local-curl.log 末尾に追記
[STEP 6]  staging deploy（既存 deploy が古い場合のみ）
[STEP 7]  staging curl matrix 5 case 実行 → outputs/phase-11/evidence/staging-curl.log
[STEP 8]  staging 4 route screenshot → outputs/phase-11/evidence/staging-*.png
[STEP 9]  evidence 整合確認 → Phase 7 AC matrix と突合
```

## STEP 0: 事前確認

```bash
# 認証確認
bash scripts/cf.sh whoami

# pnpm install / 型チェック
mise exec -- pnpm install
mise exec -- pnpm typecheck

# 現在の D1 migration apply 状態確認（staging）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# evidence 出力先を作成
mkdir -p outputs/phase-11/evidence
```

## STEP 1: apps/api を local 起動（terminal 1）

```bash
# real D1 binding を local で使う（--local + persist）
bash scripts/cf.sh dev --config apps/api/wrangler.toml --port 8787 --local --persist-to .wrangler/state
```

確認:
- `Listening on http://127.0.0.1:8787` が出る
- esbuild Host/Binary mismatch エラーが **出ない**こと（出たら Phase 6 Case A）

別 terminal で health 確認:

```bash
curl -s -o /dev/null -w "api-root %{http_code}\n" http://127.0.0.1:8787/
curl -s http://127.0.0.1:8787/public/members | jq '.items | length'  # >= 1 を期待
```

## STEP 2: apps/web を local 起動（terminal 2）

`@opennextjs/cloudflare` は build 後の `.open-next/worker.js` を wrangler dev で起動する。

```bash
# Next.js を Cloudflare Workers 形式に build
mise exec -- pnpm --filter @ubm-hyogo/web build

# OpenNext build（apps/web/package.json の script に従う）
mise exec -- pnpm --filter @ubm-hyogo/web exec opennextjs-cloudflare build

# Workers として起動（PUBLIC_API_BASE_URL を env 注入）
PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
  bash scripts/cf.sh dev --config apps/web/wrangler.toml --port 8788 --local
```

確認:
- `Listening on http://127.0.0.1:8788` が出る
- `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8788/` が `200`

## STEP 3: local curl matrix（terminal 3）

```bash
LOG=outputs/phase-11/evidence/local-curl.log
BASE=http://127.0.0.1:8788

# seed 済み member ID を api から取得（先頭 1 件）
SEED_ID=$(curl -s http://127.0.0.1:8787/public/members | jq -r '.items[0].id')
echo "# seed id: ${SEED_ID}"

# matrix 実行
{
  echo "# === local smoke $(date -u +%FT%TZ) ==="
  for ROUTE in "/" "/members" "/members/${SEED_ID}" "/members/UNKNOWN" "/register"; do
    echo "# ${ROUTE}"
    curl -s -o /tmp/body.html -w "HTTP %{http_code}\n" "${BASE}${ROUTE}"
    head -c 400 /tmp/body.html
    echo
    echo "---"
  done
} | tee -a "${LOG}"
```

期待値: `200 / 200 / 200 / 404 / 200`

## STEP 4: local screenshot（手動）

ブラウザ（Chrome）で以下 URL を開き、画面全体を `outputs/phase-11/evidence/local-<route>.png` として保存。

| route | 保存ファイル名 |
| --- | --- |
| `http://127.0.0.1:8788/` | `local-root.png` |
| `http://127.0.0.1:8788/members` | `local-members.png` |
| `http://127.0.0.1:8788/members/${SEED_ID}` | `local-members-detail.png` |
| `http://127.0.0.1:8788/register` | `local-register.png` |

## STEP 5: 不変条件 #6 検証（apps/web から D1 直接アクセスなし）

```bash
{
  echo "# === invariant #5 trace $(date -u +%FT%TZ) ==="
  rg -n "D1Database|env\\.DB" apps/web/app apps/web/src \
    --glob '!**/*.test.*' --glob '!**/__tests__/**' \
    || echo "OK: 0 件"
} | tee -a outputs/phase-11/evidence/local-curl.log
```

期待値: `OK: 0 件`

## STEP 6: staging deploy（必要時のみ・user approval 必須）

> **GATE**: staging deploy は user 明示承認後のみ実行。仕様書段階では実行しない。

```bash
# api 先行
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# web を deploy
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

deploy 後 vars 確認:

```bash
# wrangler.toml の値が deployed Worker に反映されているか確認（生値 dump はせず key の存在のみ）
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging | head -20
```

## STEP 7: staging curl matrix

```bash
LOG=outputs/phase-11/evidence/staging-curl.log
BASE=https://ubm-hyogo-web-staging.daishimanju.workers.dev
API_BASE=https://ubm-hyogo-api-staging.daishimanju.workers.dev

# seed id を staging api から取得
SEED_ID=$(curl -s "${API_BASE}/public/members" | jq -r '.items[0].id')

{
  echo "# === staging smoke $(date -u +%FT%TZ) ==="
  echo "# PUBLIC_API_BASE_URL is configured in apps/web/wrangler.toml [env.staging.vars] (value redacted in this log)"
  for ROUTE in "/" "/members" "/members/${SEED_ID}" "/members/UNKNOWN" "/register"; do
    echo "# ${ROUTE}"
    curl -s -o /tmp/body.html -w "HTTP %{http_code}\n" "${BASE}${ROUTE}"
    head -c 400 /tmp/body.html
    echo
    echo "---"
  done
} | tee -a "${LOG}"
```

期待値: `200 / 200 / 200 / 404 / 200`

## STEP 8: staging screenshot

ブラウザで `https://ubm-hyogo-web-staging.daishimanju.workers.dev/{route}` を開き、`outputs/phase-11/evidence/staging-<route>.png` として保存。最低限 `staging-members.png` 1 枚は必須（AC: real D1 経路の VISUAL 証跡）。

## STEP 9: evidence 整合確認

```bash
ls -la outputs/phase-11/evidence/
ls -la outputs/phase-11/evidence/

# AC matrix（Phase 7）の Pass 条件と突合
cat outputs/phase-07/ac-matrix.md  # 存在する場合
```

## ロールバック / 中断

| 事象 | アクション |
| --- | --- |
| local 起動で esbuild mismatch | Phase 6 Case A → `scripts/cf.sh` 経由起動を強制 |
| local `/members` が空配列 | Phase 6 Case E → `bash scripts/cf.sh d1 execute --command "SELECT COUNT(*) FROM members"` |
| staging curl が 5xx | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging` |
| D1 migration drift | `bash scripts/cf.sh d1 migrations apply <db-name> --env <env>` |

## evidence 保存ルール

- すべて `outputs/phase-11/evidence/` または `outputs/phase-11/evidence/` 配下
- 命名は Phase 4 の規則に従う
- secret 値（API token / D1 ID / OAuth token）は記録しない / log にも出さない
- staging URL の domain は記録可（公開 URL のため）

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止（rg trace で再確認）
- #8 GAS prototype を正本にしない
- #14 Cloudflare free-tier（local persist 容量に注意）

## サブタスク管理

- [ ] STEP 0〜9 の手順を outputs/phase-05/main.md に転記
- [ ] STEP 6（staging deploy）に user approval gate のチェックボックスを設置
- [ ] runbook の全コマンドが `bash scripts/cf.sh` 経由（直接 wrangler を含まない）
- [ ] secret hygiene（`.env` cat 禁止 / token redact）が明記されている

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-05/main.md`
- `outputs/phase-05/runbook.md`（任意：コマンド集の正本）

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 統合テスト連携

この workflow は実行仕様作成 wave のため、新規テストコードは追加しない。Phase 11 実行時に curl / screenshot / D1 evidence を保存する。

## 完了条件

- [ ] local 起動 + curl matrix + 不変条件 #6 trace のコマンドが追跡可能
- [ ] staging deploy + curl matrix + screenshot のコマンドが追跡可能
- [ ] evidence path（`outputs/phase-11/evidence/` + `outputs/phase-11/evidence/`）が統一
- [ ] `wrangler` 直接呼び出しが含まれない
- [ ] mock API ではなく real `apps/web → apps/api → D1` 経路を確認する手段が定義済み

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 6 へ、STEP ごとの異常分岐ポイント（esbuild / D1 binding / PUBLIC_API_BASE_URL / cold start / CORS）と Phase 6 Case 番号への mapping を渡す。
