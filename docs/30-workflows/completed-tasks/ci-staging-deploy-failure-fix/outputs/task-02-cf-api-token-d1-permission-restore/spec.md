# task-02-cf-api-token-d1-permission-restore — 実装仕様書

[実装区分: 実装仕様書 / 手動操作含む]
[種別: NON_VISUAL / CI 認証復旧タスク]
[implementation_mode: "fix"]
[並列性: task-01 と独立（独立リソース：Cloudflare dashboard + GitHub Secrets vs. workflow YAML + apps/web）]

---

## 1. 背景と現象

PR #847（`fix(ci): unify Cloudflare secret reference to CLOUDFLARE_API_TOKEN`）で `.github/workflows/backend-ci.yml` の Secret 名は `CLOUDFLARE_API_TOKEN` に統一済。しかし `dev` push 後の `backend-ci / deploy-staging` job 内 `Apply D1 migrations` step が継続して fail している。

### CI ログ要点

```
env:
  CLOUDFLARE_API_TOKEN: ***                          ← マスクされた非空値が渡っている
  CLOUDFLARE_ACCOUNT_ID: b3dde7be1cd856788fc47595ac455475
...
✘ [ERROR] A request to the Cloudflare API (/accounts/.../d1/database/.../migrations) failed.
  Authentication error [code: 10000]
  Invalid access token [code: 9109]
```

`Preflight - verify Cloudflare secrets are injected` step は `OK: Cloudflare secrets injected (token length=...)` を通過しており、**値は注入されているが Cloudflare API 側で reject** されている。つまり Secret 名 mismatch（PR #847 で解決済）ではなく **値の権限不足 / 失効** が真因。

---

## 2. 根本原因と原因切り分け手順

### 候補

| ID | 候補 | 切り分け方法 |
|----|------|-------------|
| RC-A | token に `Account → D1 → Edit` scope が付与されていない | Cloudflare Dashboard `My Profile → API Tokens` で token Permissions を目視確認 |
| RC-B | token が rotation / 失効されている | `bash scripts/cf.sh whoami` で `Unable to retrieve email...` 等が出るか確認 |
| RC-C | account ID（`b3dde7be1cd856788fc47595ac455475`）と token の組み合わせ不整合 | `bash scripts/cf.sh whoami` の出力 `Account ID` と GitHub Variables `CLOUDFLARE_ACCOUNT_ID` を突合 |
| RC-D | token は有効だが対象 D1 database（`ubm-hyogo-db-staging`）への access が account resource scope で除外されている | Dashboard で token の Account Resources を確認 |

### 確定アプローチ

切り分けに時間をかけず、**最小 scope を付与した新 token を再発行して staging / production を別 token に分離する**ことで RC-A〜RC-D を一括解消する（先行 task-cf-token-staging-injection-fix-001 が単一 token に統一する短期復旧パッチだったのに対し、本 task は最小権限分離を持ち込む恒久対応）。

---

## 3. 解決方針

### 3.1 方針サマリ

1. Cloudflare Dashboard で **staging 用** と **production 用** の API Token を **個別に発行**（最小権限）
2. GitHub Environment `staging` / `production` の `CLOUDFLARE_API_TOKEN` Secret 値を、それぞれ新 token で更新
3. ローカル 1Password の `Employee` Vault / `ubm-hyogo-env` Item の `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` field を新 token 値で上書き保管（ローカル `scripts/cf.sh` 経由の `op run` で動的注入される値の正本）
4. ユーザー承認後の `dev` への動作確認 push（empty commit 等）で `backend-ci / deploy-staging` の全 step success（AC-02）を確認
5. 旧 token は Cloudflare Dashboard で削除する（再発時混乱防止）

### 3.2 staging / production 分離の理由（設計判断）

| 観点 | 単一 token（先行 task 採用） | 分離 token（本 task 採用） |
|------|-----------------------------|---------------------------|
| 最小権限 | △ production 権限が staging job にも露出 | ✅ environment 単位で blast radius を閉じる |
| rotation コスト | ✅ 1 値更新で済む | △ 2 値更新が必要 |
| 漏洩時の影響 | × staging ログから漏れた token で production にもアクセス可能 | ✅ 漏洩した token で他環境を侵害不可 |
| `cf-token-rotation-reminder.yml` との整合 | △ | ✅ environment 単位の rotation サイクルが組める |

solo dev でも、**production token を staging CI ログに通さない**だけで防衛深度が一段上がるため、本 task では分離を採用する。

---

## 4. 変更対象リソース一覧

### 4.1 コード / 設定（**本 task では編集不要**）

`.github/workflows/backend-ci.yml` は PR #847 で既に `secrets.CLOUDFLARE_API_TOKEN` 統一済。本 task で workflow YAML / wrangler.toml / apps の編集は不要。

### 4.2 外部リソース（手動操作）

| リソース | 操作 | actor |
|----------|------|-------|
| Cloudflare Dashboard `My Profile → API Tokens` | staging 用 token を `Create Token` で発行 | user |
| Cloudflare Dashboard 同上 | production 用 token を `Create Token` で発行 | user |
| GitHub repo `Settings → Environments → staging → Secrets → CLOUDFLARE_API_TOKEN` | 値を staging 用新 token で update | user（`gh secret set` 経由でも可） |
| GitHub repo `Settings → Environments → production → Secrets → CLOUDFLARE_API_TOKEN` | 値を production 用新 token で update | user |
| 1Password Vault `Employee` / Item `ubm-hyogo-env` | `CLOUDFLARE_API_TOKEN_STAGING` field を staging 用新 token で / `CLOUDFLARE_API_TOKEN_PRODUCTION` field を production 用新 token で上書き（既に environment 単位で field 分離済み・新規 field 追加は不要） | user |
| Cloudflare Dashboard 旧 token | `Delete` で無効化 | user |

### 4.3 ドキュメント（本 task で作成）

| パス | 種別 |
|------|------|
| `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/spec.md` | 新規 |
| `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/phase-12/implementation-guide.md` | 新規 |
| `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/task-02-cf-api-token-d1-permission-restore/runbook.md` | 新規 |

---

## 5. API Token scope 設計

### 5.1 Permissions（staging / production 共通）

| 対象 | scope | 採用 | 根拠 |
|------|-------|------|------|
| `Account → D1 → Edit` | Edit | ✅ 必須 | `wrangler d1 migrations apply` が migration を D1 に書き込むため |
| `Account → Workers Scripts → Edit` | Edit | ✅ 必須 | `wrangler deploy --env <env>` が Worker script を upload するため |
| `Account → Account Settings → Read` | Read | △ 任意 | `wrangler whoami` の account 解決に使用。CI 実行では account ID を `vars.CLOUDFLARE_ACCOUNT_ID` で渡しており不要だが、`scripts/cf.sh whoami` での切り分け時に欲しいため **付与する**（最小権限を多少緩めて運用性を取る判断）|
| `User → User Details → Read` | Read | △ 任意 | `wrangler whoami` の email 解決用。CI 実行では不要。**付与しない**（最小権限優先）|
| `Account → Workers KV Storage → Edit` | Edit | ❌ 不要 | 現状 KV binding を本番 deploy で使用していない |
| `Zone → Workers Routes → Edit` | Edit | ❌ 不要 | custom domain / zone route は manual で運用中（先行 task の判断を踏襲）|

### 5.2 Account Resources

- `Include → 当該 account のみ`（`b3dde7be1cd856788fc47595ac455475`）
- 他 account は除外

### 5.3 Zone Resources

- **不要**（Zone レベル操作なし）。`All zones from an account` 等は選択しない。

### 5.4 Client IP Address Filtering

- 設定しない（GitHub Actions runner IP は固定不可のため）。

### 5.5 TTL

- 推奨: **90 日**（`.github/workflows/cf-token-rotation-reminder.yml` の rotation サイクルと連動）
- staging / production で同じ TTL を採用し、rotation を同時実施できるようにする
- TTL 未設定（無期限）は禁止

### 5.6 命名規約

- staging: `ubm-hyogo-ci-staging-YYYY-MM-DD`
- production: `ubm-hyogo-ci-production-YYYY-MM-DD`

---

## 6. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | Cloudflare account credentials（user 認証）/ GitHub repo admin 権限（user）|
| 出力 | 新 token 値 ×2（staging / production） |
| 副作用 | **新 token 発行で旧 token は自動失効しない**（同じ名前で `Roll` した場合のみ旧値が無効化される）。本 task は **新規発行** を選択するため、旧 token は手動 Delete が必要 |
| 不可逆性 | 発行直後の token 値表示画面を閉じると再表示不可。1Password へ即座に保管する手順を runbook に明記 |

---

## 7. 検証手順

実行前提: ローカル `scripts/cf.sh` が 1Password 経由で新 token を参照できる状態にしておく（4.2 の 1Password 更新後）。

### 7.1 GitHub Secrets 存在確認（**値は表示できない**）

```bash
gh secret list --env staging --repo daishiman/UBM-Hyogo
gh secret list --env production --repo daishiman/UBM-Hyogo
```

期待: `CLOUDFLARE_API_TOKEN` が両 environment に存在し、`Updated` 列が本 task 実施時刻に近いこと。`gh secret list` は値を返さない（API 仕様）ため、値の正しさは次の CLI 検証で確認する。

### 7.2 auth 動作確認（ローカル op 経由）

```bash
bash scripts/cf.sh whoami
```

期待:

```
👋 You are logged in with an API Token, associated with the email <masked>.
Account Name           Account ID
ubm-hyogo (or actual)  b3dde7be1cd856788fc47595ac455475
```

`Account ID` が GitHub Variables `CLOUDFLARE_ACCOUNT_ID` と一致すること（RC-C 切り分け）。

### 7.3 D1:Edit scope 動作確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging \
  --config apps/api/wrangler.toml --env staging --remote
```

期待: migration 一覧（または `No migrations to apply.`）が表示され、401/403 にならないこと。

> `--config apps/api/wrangler.toml` 必須（ワークツリー root から実行する場合、wrangler は cwd の `wrangler.jsonc` を探すため省略すると `No configuration file found` になる）。`--remote` 必須（省略時は `Resource location: local` で local D1 を見にいくため scope 検証にならない）。

### 7.4 Workers Scripts:Edit scope 動作確認（dry-run）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun
```

期待: bundle 生成が成功し、API 認証エラーが出ないこと（実 deploy は行わない）。

### 7.5 CI での最終受け入れ（AC-02）

以下は **Phase 13 / user approval gate 後にのみ実行**する。Claude / Codex が自動実行してはならない。

```bash
# 動作確認のための empty commit
git commit --allow-empty -m "chore(ci): verify cf api token rotation"
git push origin dev
gh run watch  # backend-ci の deploy-staging を監視
```

期待: `backend-ci / deploy-staging` job の全 step success。`Apply D1 migrations` で `Authentication error [code: 10000]` が出ないこと。

---

## 8. テスト方針

| 種別 | 対象 | 備考 |
|------|------|------|
| 単体 test | なし | 外部認証 / 運用 task のためコード変更なし |
| 静的検証 | なし | workflow YAML は #847 で確定済、本 task では編集しない |
| 受け入れ test | `backend-ci / deploy-staging` workflow の実行 | §7.5 |
| smoke | `runtime-smoke-staging` workflow が連鎖 success すること | deploy-staging 成功時のみ起動 |

> AC-04（`pnpm typecheck && pnpm lint`）はコード変更がないため evidence は `N/A`。AC-05 / AC-06 は task-01 側で確認される。

---

## 9. ローカル実行・検証コマンド（一括再掲）

```bash
# 1) GitHub Secrets 存在確認（値は出ない）
gh secret list --env staging --repo daishiman/UBM-Hyogo
gh secret list --env production --repo daishiman/UBM-Hyogo

# 2) Cloudflare API auth + account ID 突合
bash scripts/cf.sh whoami

# 3) D1:Edit scope 動作確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging \
  --config apps/api/wrangler.toml --env staging --remote

# 4) Workers Scripts:Edit scope dry-run
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun

# 5) CI 動作確認
# Phase 13 / user approval gate 後にのみ実行
git commit --allow-empty -m "chore(ci): verify cf api token rotation"
git push origin dev
gh run watch
```

---

## 10. Definition of Done

- [ ] staging 用 / production 用 の 2 token が Cloudflare Dashboard で個別に発行されている（命名規約 §5.6 準拠 / TTL 90 日）
- [ ] 各 token の Permissions が §5.1 通り（D1:Edit + Workers Scripts:Edit + Account Settings:Read）に設定されている
- [ ] GitHub Environment `staging` の `CLOUDFLARE_API_TOKEN` が staging 用新 token に更新されている（`gh secret list` の `Updated` が本 task 実施時刻）
- [ ] GitHub Environment `production` の `CLOUDFLARE_API_TOKEN` が production 用新 token に更新されている
- [ ] 1Password Vault `Employee` / Item `ubm-hyogo-env` の `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` field に新 token が保管され、`scripts/cf.sh whoami` が成功する
- [ ] §7.2 / §7.3 / §7.4 の CLI 検証がローカルで pass
- [ ] `dev` push で `backend-ci / deploy-staging` の全 step success（AC-02）
- [ ] `runtime-smoke-staging` workflow も連鎖して success
- [ ] 旧 token が Cloudflare Dashboard で Delete 済（再発時混乱防止）
- [ ] CI ログで `CLOUDFLARE_API_TOKEN: ***`（マスク表示）であること

---

## 11. ロールバック手順

token 認証復旧 task の特性上、**従来の意味での rollback（旧値復帰）は不可**：

- 新 token 発行時点で旧 token は Dashboard に並列存在するが、本 task 完了時に旧 token を Delete するため復帰経路はない
- 万一新 token に問題があった場合は **追加で別 token を発行** することが唯一の復旧経路

ケース別 mitigation の詳細は [`./runbook.md`](./runbook.md) を参照。

---

## 12. リスクと緩和

| ID | リスク | 緩和 |
|----|--------|------|
| R-01 | 過剰権限 token を発行してしまう | §5.1 の最小 scope 表に厳密に従う。Workers Routes / KV / User Details は付与しない |
| R-02 | production token と staging token を取り違える | §5.6 命名規約で識別性を確保。1Password Item `ubm-hyogo-env` は `CLOUDFLARE_API_TOKEN_STAGING` / `CLOUDFLARE_API_TOKEN_PRODUCTION` で field 分離済み |
| R-03 | token 値が CI ログに平文で漏れる | `scripts/redaction-check.sh` の既存 gate が継続稼働。本 task で Secret 設定経路は変更しない |
| R-04 | 旧 token を消し忘れて長期的に有効な token が増殖 | DoD §10 末尾の「旧 token Delete」を必須化 / `cf-token-rotation-reminder.yml` で 90 日サイクルを監視 |
| R-05 | 新 token を 1Password に保管し損ね、再表示できない | 発行直後に 1Password へ書き込む手順を runbook 冒頭に配置 |
| R-06 | Account Resources を誤って `All accounts` にする | §5.2 で `Include → 当該 account のみ` を明示。発行画面で UI 確認必須 |
| R-07 | 1Password で `_STAGING` field を新値で更新しても `.env` が古い `CLOUDFLARE_API_TOKEN`（サフィックス無し）field を参照していて wrangler が古い token を引き続ける（**2026-05-20 実発生**）| `.env` 行を `CLOUDFLARE_API_TOKEN="op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN_STAGING"` に統一し、rotation 作業前に `bash scripts/with-env.sh bash -c 'echo ${CLOUDFLARE_API_TOKEN:0:6}'` が `cfut_` で始まることを確認。古いサフィックス無し field は混乱防止のため削除 |

---

## 13. 並列性

- task-01（web-build-env-injection）と独立リソースのため並列実行可能
- 両 task 完了後の `dev` empty commit push で AC-01..06 を一括検証する設計

---

## 14. 参照

- `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/index.md`
- `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/outputs/phase-{1,2,3}/phase-N.md`
- `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md`（先行・単一 token 統一）
- `CLAUDE.md` §Cloudflare 系 CLI 実行ルール / §シークレット管理
- `.github/workflows/cf-token-rotation-reminder.yml`
- Cloudflare docs: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>
