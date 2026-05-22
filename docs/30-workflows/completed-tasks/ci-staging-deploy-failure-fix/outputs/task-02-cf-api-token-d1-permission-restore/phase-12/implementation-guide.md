# Phase 12: 実装ガイド — task-02-cf-api-token-d1-permission-restore

[実装区分: 実装仕様書 / 手動操作含む]
[visual evidence: N/A（画面差分なし） / CI runtime evidence: required after user approval]

---

## 1. このタスクで何をするか（中学生にもわかる説明）

GitHub の自動デプロイ（CI）が「Cloudflare というクラウドにファイルを置こう」とするときに、**鍵（API Token）が違うよ** と Cloudflare から断られています。具体的には「Invalid access token（無効な鍵）」というエラーが出続けている状態です。

この task では、**新しい鍵を Cloudflare で作って、GitHub に登録し直し**、CI が再びデプロイできるようにします。さらに、staging（テスト環境）用と production（本番環境）用で **別々の鍵** を使うようにして、万一片方が漏れてももう片方は安全に保てるようにします。

鍵は実物（値）をドキュメントには書きません。1Password という金庫アプリに保管し、ローカルから使うときは金庫から自動で取り出す仕組み（`scripts/cf.sh`）を使います。

---

## 2. なぜこれが必要か

- 直前の修正（PR #847）では「鍵を入れる箱の名前」を直しただけで、中身の鍵そのものは古いままだった
- そのため CI ログでは鍵が `***`（マスク表示）として渡っているのに、Cloudflare 側で「この鍵は無効」と拒否されている
- staging だけ直っても production token に過剰な権限が付いたままだと、staging のログに production の鍵が露出するリスクがあるため、ついでに **最小権限分離** に作り直す

これを直さないと:

- `dev` ブランチに push しても staging に最新コードが反映されない
- `backend-ci / deploy-staging` の失敗が `runtime-smoke-staging` の失敗を連鎖させる
- production リリース時（`dev → main`）にも同じエラーで blocked になる

---

## 3. 変更する場所と理由

| 場所 | 変更内容 | 理由 |
|------|---------|------|
| Cloudflare Dashboard `My Profile → API Tokens` | staging 用 / production 用の token を 2 つ新規発行 | 鍵そのものを差し替える唯一の経路 |
| GitHub `Settings → Environments → staging → Secrets → CLOUDFLARE_API_TOKEN` | 値を staging 用新 token で更新 | CI が読む鍵の保管場所 |
| GitHub `Settings → Environments → production → Secrets → CLOUDFLARE_API_TOKEN` | 値を production 用新 token で更新 | 同上（本番側）|
| 1Password Vault `Private` / Item `Cloudflare（senpai）` | 新 token を保管 | ローカル `scripts/cf.sh` が op 経由で参照する正本 |
| Cloudflare Dashboard 旧 token | Delete | 再発時の混乱防止 |

> **コード / workflow YAML は本 task で編集しません**（PR #847 で `CLOUDFLARE_API_TOKEN` への統一は完了済）。

---

## 4. 実装手順（ステップバイステップ）

`(user)` = ユーザー手動 / `(claude)` = Claude Code 自動。

### Step 0. (claude) 前提確認

```bash
# Secret 名統一が PR #847 で済んでいることを確認
grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/backend-ci.yml
# 期待: deploy-staging / deploy-production 配下に 8 箇所程度ヒット

# 旧 Secret 名が残っていないこと
grep -n "CF_TOKEN_D1_\|CF_TOKEN_WORKERS_" .github/workflows/backend-ci.yml
# 期待: 0 件
```

### Step 1. (user) staging 用 API Token を Cloudflare Dashboard で発行（手動操作）

1. <https://dash.cloudflare.com/profile/api-tokens> を開く
2. `Create Token` → `Get started`（Custom token）
3. **Token name**: `ubm-hyogo-ci-staging-YYYY-MM-DD`（今日の日付を入れる）
4. **Permissions** を以下 3 行追加:
   - `Account` / `D1` / `Edit`
   - `Account` / `Workers Scripts` / `Edit`
   - `Account` / `Account Settings` / `Read`
5. **Account Resources**: `Include` / `Specific account` / 当該 account のみ選択
6. **Zone Resources**: 触らない（未設定で OK）
7. **TTL**: 開始日 = 今日 / 終了日 = 今日 + 90 日
8. `Continue to summary` → `Create Token`
9. **表示された token 値をすぐ 1Password に保管**（画面を閉じると再表示不可）

### Step 2. (user) production 用 API Token を発行（手動操作）

Step 1 と同じ手順で、**Token name のみ** `ubm-hyogo-ci-production-YYYY-MM-DD` に変更して発行する。Permissions / Account Resources / TTL は同一。

### Step 3. (user) 1Password に保管（手動操作）

1Password `Private / Cloudflare（senpai）` Item を開き、

| field | 値 |
|-------|----|
| `password` | Step 1 で発行した **staging 用** token |
| `password-production`（新規追加） | Step 2 で発行した **production 用** token |
| `notesPlain` | `rotated YYYY-MM-DD (TTL 90d) — staging+production split` を追記 |

### Step 4. (user) GitHub Environment Secrets を更新（手動操作）

ターミナルで以下を実行。`gh secret set` は対話入力推奨（コピペ事故防止）:

```bash
# staging
gh secret set CLOUDFLARE_API_TOKEN --env staging --repo daishiman/UBM-Hyogo
# → 「Paste your secret:」プロンプトに staging 用 token をペースト

# production
gh secret set CLOUDFLARE_API_TOKEN --env production --repo daishiman/UBM-Hyogo
# → 「Paste your secret:」プロンプトに production 用 token をペースト
```

### Step 5. (claude) Secret 登録時刻の確認

```bash
gh secret list --env staging    --repo daishiman/UBM-Hyogo
gh secret list --env production --repo daishiman/UBM-Hyogo
```

両方とも `CLOUDFLARE_API_TOKEN` の `Updated` 列が直近時刻になっていること（値は API 仕様で表示されない）。

### Step 6. (claude) ローカル CLI で auth 動作確認

```bash
bash scripts/cf.sh whoami
```

`Account ID` が `b3dde7be1cd856788fc47595ac455475` と一致すること。Authentication error が出ないこと。

### Step 7. (claude) D1:Edit scope の動作確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

403 / `Invalid access token` が出ないこと。

### Step 8. (claude) Workers Scripts:Edit scope の dry-run

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun
```

bundle 生成成功で終了すること（実 deploy はしない）。

### Step 9. (user-approved) CI 動作確認

この step は **Phase 13 / user approval gate 後にのみ実行**する。Claude / Codex が自動実行してはならない。

```bash
git commit --allow-empty -m "chore(ci): verify cf api token rotation (task-02)"
git push origin dev
gh run watch
```

`backend-ci / deploy-staging` 全 step success を確認。`Apply D1 migrations` で 10000/9109 エラーが出ないこと。`runtime-smoke-staging` も連鎖 success すること。

### Step 10. (user) 旧 token を Delete（手動操作）

Cloudflare Dashboard `My Profile → API Tokens` で旧 token を `Delete`。**Step 9 の CI success を確認してから実施する**（順序を間違えると CI が落ちる）。

---

## 5. テスト方法

| ID | テスト | 種別 | 確認方法 |
|----|-------|------|---------|
| T-01 | Secret が両 environment に登録されている | 静的 | Step 5 の `gh secret list` 出力 |
| T-02 | ローカルから Cloudflare API が叩ける | 動的 | Step 6 の `cf.sh whoami` |
| T-03 | D1:Edit scope が有効 | 動的 | Step 7 の migrations list |
| T-04 | Workers Scripts:Edit scope が有効 | 動的 | Step 8 の dry-run |
| T-05 | CI 上で deploy 全 step が成功 | E2E | Step 9 の `gh run watch` |
| T-06 | smoke 連鎖 | E2E | `runtime-smoke-staging` workflow success |
| T-07 | ログマスク | 静的 | `gh run view <RUN_ID> --log \| grep CLOUDFLARE_API_TOKEN` → `***` |

> 単体 test（vitest 等）はコード変更がないため対象外。

---

## 6. 検証コマンド

```bash
# Secret 存在確認
gh secret list --env staging    --repo daishiman/UBM-Hyogo
gh secret list --env production --repo daishiman/UBM-Hyogo

# Cloudflare API auth 動作
bash scripts/cf.sh whoami

# D1:Edit
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# Workers Scripts:Edit（実 deploy なし）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run --outdir=/tmp/cf-dryrun

# CI 動作確認（empty commit）
# Phase 13 / user approval gate 後にのみ実行
git commit --allow-empty -m "chore(ci): verify cf api token rotation (task-02)"
git push origin dev
gh run watch

# マスク確認
gh run view <RUN_ID> --log | grep -i "CLOUDFLARE_API_TOKEN"
# 期待: CLOUDFLARE_API_TOKEN: ***
```

---

## 7. 失敗したらどうするか

詳細な切り分け・rollback 手順は [`../runbook.md`](../runbook.md) を参照。

代表的な失敗パターン:

| 症状 | 一次対応 |
|------|---------|
| `cf.sh whoami` が `Authentication error 9109` | 1Password の値が古い。Step 1〜3 をやり直し |
| `cf.sh whoami` の Account ID が違う | token を当該 account 配下で再発行 |
| `d1 migrations list` が 403 | token に D1:Edit が未付与。Dashboard で Edit するか再発行 |
| CI の preflight が `CF_TOKEN is empty` | GitHub Secret が登録されていない。Step 4 を実行 |
| CI の `Apply D1 migrations` で 10000/9109 | GitHub Secret 値とローカル 1Password 値が乖離。Step 4 を再実行 |

---

## 8. Definition of Done

- [ ] staging 用 / production 用 2 token が個別発行されている（命名規約準拠 / TTL 90 日）
- [ ] 各 token の Permissions が D1:Edit + Workers Scripts:Edit + Account Settings:Read のみ
- [ ] GitHub Environment `staging` / `production` の `CLOUDFLARE_API_TOKEN` Secret が新値に更新済
- [ ] 1Password Item に新 token 2 種が保管され、`scripts/cf.sh whoami` が成功
- [ ] §6 の検証コマンドが全て success
- [ ] `dev` push で `backend-ci / deploy-staging` 全 step success（AC-02）
- [ ] `runtime-smoke-staging` が連鎖 success
- [ ] 旧 token が Cloudflare Dashboard で Delete 済
- [ ] CI ログで `CLOUDFLARE_API_TOKEN: ***`（マスク表示）

---

## 9. 参考リンク

- 仕様書: [`../spec.md`](../spec.md)
- runbook: [`../runbook.md`](../runbook.md)
- 先行 task: `docs/30-workflows/task-cf-token-staging-injection-fix-001/index.md`（単一 token 統一の短期復旧）
- 上位 workflow: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/index.md`
- CLAUDE.md §Cloudflare 系 CLI 実行ルール / §シークレット管理 / §`apps/web` env アクセス不変条件
- workflow: `.github/workflows/backend-ci.yml` / `.github/workflows/cf-token-rotation-reminder.yml`
- CLI ラッパー: `scripts/cf.sh`
- Cloudflare API Token docs: <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>
- 関連 PR: #847（`fix(ci): unify Cloudflare secret reference to CLOUDFLARE_API_TOKEN`）
