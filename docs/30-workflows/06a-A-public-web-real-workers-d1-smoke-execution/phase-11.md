# Phase 11: 手動 smoke / 実測 evidence — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 11 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| 更新日 | 2026-05-02 |
| taskType | implementation / spec-with-execution-runbook |
| visualEvidence | VISUAL_ON_EXECUTION |
| status | spec_created / pending-user-approval |

## 目的

本 phase は「real Workers + Cloudflare D1 binding を経由した実測 evidence の取得手順を仕様化」する。`apps/web` SSR/RSC fetch → `apps/api` Hono → D1 の本番経路を、local（`wrangler dev`）と staging（Cloudflare deployed）の 2 環境で実測し、curl log・screenshot を `outputs/phase-11/evidence/` に保存することで AC-1〜AC-4 を観測裏付けする。

VISUAL モードで運用するため、4 route family（`/`, `/members`, `/members/[id]`, `/register`）全件の screenshot 取得を必須とする（完了タスク `06a-followup-001` の NON_VISUAL とは明確に異なる）。

## ユーザー承認 gate（最重要）

- 本仕様書作成では **アプリケーションコード変更・deploy・実 smoke 実行・commit・push・PR 作成を一切行わない**。
- 以下の操作はすべて user の明示的 GO 指示後にのみ Phase 5（実装ランブック）/ 本 Phase 11 の手順に従って実行する。
  - `bash scripts/cf.sh dev ...` の起動
  - staging 環境での curl 実行
  - 実ブラウザによる screenshot 取得
  - `outputs/phase-11/evidence/` への evidence 書き込み
- evidence path の placeholder のみ事前確保し、実値は GO 後に追記する。

## 前提条件

- Phase 1〜10 が `spec_created` 状態で完了
- 1Password (`.env` の `op://...` 参照) が解決可能（`op signin` 済み）
- 04a public API 実装、02b D1 migration が apply 済み
- staging 側の `apps/web` / `apps/api` がデプロイ済みで、`PUBLIC_API_BASE_URL` が staging api host を指している
- seed member が D1 に最低 1 件投入済み（`/members` で `items.length >= 1` を観測可能）
- 本タスクは Issue #273（CLOSED）を再オープンしない

## evidence ディレクトリ設計

```
outputs/phase-11/
├── main.md                                    # 実測サマリ（AC trace 表）
└── evidence/
    ├── local-curl.log                         # local 4 route × 5 cases curl 出力
    ├── staging-curl.log                       # staging 4 route × 5 cases curl 出力
    ├── local-screenshot-root.png              # local /
    ├── local-screenshot-members.png           # local /members
    ├── local-screenshot-member-detail.png     # local /members/{seeded-id}
    ├── local-screenshot-register.png          # local /register
    ├── staging-screenshot-root.png            # staging /
    ├── staging-screenshot-members.png         # staging /members
    ├── staging-screenshot-member-detail.png   # staging /members/{seeded-id}
    └── staging-screenshot-register.png        # staging /register
```

| ファイル | サイズ目安 | 内容 |
| --- | --- | --- |
| `local-curl.log` / `staging-curl.log` | < 50KB / 各 | status / response headers の主要 5 行 / body は最初 200 文字 + last 100 文字を抜粋 |
| `*-screenshot-*.png` | < 500KB / 各 | viewport 1280x800、初期描画完了後の full-page スクリーンショット |

## smoke 対象 route と期待値

| # | route | method | 期待 status | 期待 body 抜粋 | 経路確認観点 |
| --- | --- | --- | --- | --- | --- |
| R1 | `/` | GET | 200 | `<title>` に「UBM 兵庫」を含む / 公開 hero CTA `/register` link を含む | apps/web SSR が成功 |
| R2 | `/members` | GET | 200 | `data-testid="member-card"` ノードが 1 件以上 / `items.length>=1` 由来の DOM | apps/web → apps/api `/public/members` → D1 |
| R3 | `/members/{seeded-id}` | GET | 200 | `<h1>` に seed member の `displayName` を含む | apps/web → apps/api `/public/members/:id` → D1 |
| R4 | `/members/UNKNOWN` | GET | 404 | `not_found` 文言 or Next.js 404 page | apps/api `404` を apps/web が透過 |
| R5 | `/register` | GET | 200 | Google Form の `responderUrl` `1FAIpQLSeWfv-...` を含む | static linkable 確認、不変条件 #6 順守 |

> **seeded id 取得**: ターミナル C で `curl -s http://localhost:8787/public/members | jq -r '.items[0].id'` を 1 回実行し、変数 `SEEDED_ID` に保持する。staging も同様。値は curl log に記録するが、ID はランダム ULID 想定で機微情報ではないため記録可。

## Step 1: local smoke（real Workers + D1 経路）

### 1-1. 起動（ターミナル A: apps/api）

```bash
bash scripts/cf.sh dev --config apps/api/wrangler.toml --local --persist-to .wrangler/state
```

- 期待: `Listening on http://127.0.0.1:8787` が出力される
- esbuild mismatch が発生したら **中断**。Phase 6 異常系の `ESBUILD_BINARY_PATH` 解決手順へフォールバック

### 1-2. 起動（ターミナル B: apps/web）

```bash
PUBLIC_API_BASE_URL=http://localhost:8787 \
INTERNAL_API_BASE_URL=http://localhost:8787 \
  bash scripts/cf.sh dev --config apps/web/wrangler.toml --local --port 8788
```

- 期待: `http://127.0.0.1:8788` で listen
- `apps/web` の Next.js 側で `PUBLIC_API_BASE_URL` が default の mock URL に fallback していないことを起動時 log で確認

### 1-3. seed id 取得

```bash
SEEDED_ID=$(curl -s http://localhost:8787/public/members | jq -r '.items[0].id')
echo "SEEDED_ID=$SEEDED_ID" | tee -a outputs/phase-11/evidence/local-curl.log
```

### 1-4. curl 実行（ターミナル C）

各コマンドの実行結果を `outputs/phase-11/evidence/local-curl.log` に追記する。`-i` で status / headers を残し、`body` は `head -c 200 ; ... ; tail -c 100` 相当で抜粋する。

```bash
LOG=outputs/phase-11/evidence/local-curl.log

for ROUTE in "/" "/members" "/register"; do
  echo "===== GET ${ROUTE} =====" >> "$LOG"
  curl -sS -i "http://127.0.0.1:8788${ROUTE}" | sed -n '1,15p' >> "$LOG"
  echo "..." >> "$LOG"
done

echo "===== GET /members/${SEEDED_ID} =====" >> "$LOG"
curl -sS -i "http://127.0.0.1:8788/members/${SEEDED_ID}" | sed -n '1,15p' >> "$LOG"

echo "===== GET /members/UNKNOWN (expect 404) =====" >> "$LOG"
curl -sS -i "http://127.0.0.1:8788/members/UNKNOWN" | sed -n '1,10p' >> "$LOG"
```

### 1-5. screenshot 取得（ターミナル D: 実ブラウザ）

各 route を Chromium 系で開き、初期描画完了（fetch 完了 + spinner 消滅）後に full-page スクリーンショットを保存する。

| route | 保存先 |
| --- | --- |
| `http://127.0.0.1:8788/` | `outputs/phase-11/evidence/local-screenshot-root.png` |
| `http://127.0.0.1:8788/members` | `outputs/phase-11/evidence/local-screenshot-members.png` |
| `http://127.0.0.1:8788/members/${SEEDED_ID}` | `outputs/phase-11/evidence/local-screenshot-member-detail.png` |
| `http://127.0.0.1:8788/register` | `outputs/phase-11/evidence/local-screenshot-register.png` |

> 自動化する場合は Playwright を local devDependency として使用可。Playwright は本タスクの DevDependencies 候補として Phase 12 の implementation-guide に記載。

### 1-6. local 完了判定

- AC-1: `wrangler dev` が 2 回連続 fresh 起動で esbuild mismatch なく成功
- AC-2: 5 cases curl が status 200 / 200 / 200 / 200 / 404
- AC-3: `/members` body / `/members/{SEEDED_ID}` body が seed displayName を含む（D1 経路観測）

## Step 2: staging smoke（Cloudflare deployed 経路）

### 2-1. staging URL の確認

```bash
# wrangler 直接呼び出しは禁止。必ず scripts/cf.sh 経由
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging | head -20
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging | head -20
```

- staging URL は `apps/web` / `apps/api` 双方の `wrangler.toml` の `routes` または Cloudflare dashboard 由来
- `PUBLIC_API_BASE_URL` が staging api host を指していることを `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging` 経由で確認（**値そのものは log に書かない、設定済みの旨のみ記録**）

### 2-2. seed id 取得

```bash
WEB_HOST="https://web.staging.example.workers.dev"   # 実際は wrangler.toml の値
API_HOST="https://api.staging.example.workers.dev"

SEEDED_ID=$(curl -sS "${API_HOST}/public/members" | jq -r '.items[0].id')
echo "SEEDED_ID=${SEEDED_ID}" | tee -a outputs/phase-11/evidence/staging-curl.log
```

### 2-3. curl 実行

local と同一の 5 cases を `${WEB_HOST}` 経由で実施し、`outputs/phase-11/evidence/staging-curl.log` に追記する。

```bash
LOG=outputs/phase-11/evidence/staging-curl.log

for ROUTE in "/" "/members" "/register"; do
  echo "===== GET ${WEB_HOST}${ROUTE} =====" >> "$LOG"
  curl -sS -i "${WEB_HOST}${ROUTE}" | sed -n '1,15p' >> "$LOG"
done

echo "===== GET ${WEB_HOST}/members/${SEEDED_ID} =====" >> "$LOG"
curl -sS -i "${WEB_HOST}/members/${SEEDED_ID}" | sed -n '1,15p' >> "$LOG"

echo "===== GET ${WEB_HOST}/members/UNKNOWN =====" >> "$LOG"
curl -sS -i "${WEB_HOST}/members/UNKNOWN" | sed -n '1,10p' >> "$LOG"
```

### 2-4. screenshot 取得

| route | 保存先 |
| --- | --- |
| `${WEB_HOST}/` | `outputs/phase-11/evidence/staging-screenshot-root.png` |
| `${WEB_HOST}/members` | `outputs/phase-11/evidence/staging-screenshot-members.png` |
| `${WEB_HOST}/members/${SEEDED_ID}` | `outputs/phase-11/evidence/staging-screenshot-member-detail.png` |
| `${WEB_HOST}/register` | `outputs/phase-11/evidence/staging-screenshot-register.png` |

### 2-5. staging 完了判定

- AC-4: 5 cases curl が local と同一の status pattern
- AC-5: `PUBLIC_API_BASE_URL` が staging で localhost fallback していないことを記録（値の実体は記載しない）

## Step 3: 06a 親タスクへの evidence trace

1. `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-11/` に、本タスク evidence へのリンク追記コメントを残す（ファイルコピーは不要、相対 path で trace を保つ）。
2. AC-6 trace を `outputs/phase-11/main.md` の evidence 一覧に明記する。

## 機微情報の取り扱い

- `CLOUDFLARE_API_TOKEN` / Auth.js secret / D1 database internal id を含むホスト名は **ログ・screenshot に絶対に含めない**
- curl 実行時に `-H "Authorization: ..."` は public smoke では不要。使わない
- staging URL がホスト名のみで内部 ID を含まないことを保存前に目視確認
- `.env` を `cat` / `Read` しない

## 多角的チェック観点（不変条件 trace）

- #5 public/member/admin boundary: 本 smoke は public layer のみ。member / admin route は対象外
- #6 apps/web から D1 直接アクセス禁止: local / staging 双方で apps/web → apps/api → D1 の 2-hop を curl log で確認
- #8 localStorage / GAS prototype を正本にしない: `/register` は実 Google Form responderUrl のみ参照
- #14 Cloudflare free-tier: staging は Workers Free / D1 Free 範囲内。`bash scripts/cf.sh d1 info` で usage 確認可

## サブタスク管理

- [ ] Step 0: ユーザー承認 gate を通過したか確認
- [ ] Step 1-1〜1-6: local smoke（curl 5 + screenshot 4）を取得
- [ ] Step 2-1〜2-5: staging smoke（curl 5 + screenshot 4）を取得
- [ ] Step 3: 06a 親タスクへ evidence trace を追記
- [ ] `outputs/phase-11/main.md` に AC trace 表を完成
- [ ] 機微情報チェックリストを通過
- [ ] Phase 12 へ blocker / pending を引き継ぐ

## 失敗時のフォールバック

| 事象 | 対応 |
| --- | --- |
| esbuild mismatch | 中断。Phase 6 異常系の `ESBUILD_BINARY_PATH` 診断手順へ |
| staging で 5xx | smoke 中断。`bash scripts/cf.sh d1 migrations list <db> --env staging` で binding 確認 |
| `/members` で `items.length === 0` | seed 投入が未完。02b 側 migration / seed タスクへ差し戻し（本 phase では NO-GO） |
| `PUBLIC_API_BASE_URL` 未設定 | apps/web 側設定タスクへ差し戻し（本 phase では NO-GO） |

いずれの場合も Issue #273 は再オープンしない。新規 followup spec として別タスク化する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-11/main.md`（AC trace 表 + evidence path 一覧）
- `outputs/phase-11/evidence/local-curl.log`
- `outputs/phase-11/evidence/staging-curl.log`
- `outputs/phase-11/evidence/local-screenshot-{root,members,member-detail,register}.png`
- `outputs/phase-11/evidence/staging-screenshot-{root,members,member-detail,register}.png`

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 統合テスト連携

この workflow は実行仕様作成 wave のため、新規テストコードは追加しない。Phase 11 実行時に curl / screenshot / D1 evidence を保存する。

## 完了条件

- [ ] local real Workers/D1 smoke の curl log が保存されている
- [ ] staging real Workers/D1 smoke の curl log が保存されている
- [ ] 公開 4 route family の screenshot が local / staging 双方で保存されている（VISUAL モード必須）
- [ ] mock API ではなく apps/web → apps/api → D1 経路であることが evidence body 抜粋に明記されている
- [ ] 機微情報（API token / auth secret / D1 internal id）が evidence に含まれていない
- [ ] 06a 親タスク outputs/phase-11/ への trace 追記済み

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスク `06a-followup-001` の復活ではなく VISUAL モード follow-up gate になっている
- [ ] 仕様書段階で実装、deploy、commit、push、PR を実行していない
- [ ] user approval gate を Step 0 として明記している

## 次 Phase への引き渡し

Phase 12 へ次を引き渡す:

- 本 phase の AC trace（AC-1〜AC-6）と evidence path 一覧
- `PUBLIC_API_BASE_URL` 設定 pending / seed 投入 pending の blocker 状態
- 機微情報除外チェックリストの結果
- approval gate 通過記録
