# Phase 5 成果物 — 実装ランブック

## 1. ランブック概要

UT-27 base case（案 A: `gh` CLI 直接実行 + 1Password 手動同期）の **6 ステップランブック** を定義する。Step 0（前提確認）/ Step 1（上流確認 inventory）/ Step 2（environment 作成）/ Step 3（secret 配置）/ Step 4（variable 配置）/ Step 5（動作確認 + 同期検証）の順序を厳守し、同名 repository / environment **併存禁止**、`CLOUDFLARE_PAGES_PROJECT` は Variable 側のみ。Step 2 / 3 / 4 / 5 の実 `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` は **Phase 13 ユーザー承認後** にのみ走る（user_approval_required: true）。本ファイルはコマンドを記述するが**実行は禁止**。

## 2. 状態（NOT EXECUTED テンプレ）

| ステップ | 状態 | 副作用 | Phase 13 承認 必須 |
| --- | --- | --- | --- |
| Step 0 前提確認 | NOT EXECUTED | なし | 不要（GET / 文書確認のみ） |
| Step 1 上流確認 inventory | NOT EXECUTED | なし（GET / grep / op field 存在確認のみ） | 不要 |
| Step 2 environment 作成 (PUT × 2) | NOT EXECUTED | **GitHub 実値変更** | **必須** |
| Step 3 secret 配置 (set × 4) | NOT EXECUTED | **GitHub 実値変更 / 1Password Notes 更新** | **必須** |
| Step 4 variable 配置 (set × 1) | NOT EXECUTED | **GitHub 実値変更** | **必須** |
| Step 5 動作確認 + 同期検証 | NOT EXECUTED | **`git push origin dev` / 一時 secret delete** | **必須** |

## 3. Step 0: 前提確認（必須ゲート）

```bash
# 上流 3 件完了確認
gh pr list --search "UT-05" --state merged --json number,title
grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml
bash scripts/cf.sh pages project list
op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,api_token_production,account_id | jq 'keys'
op item get "Discord"    --vault UBM-Hyogo --format json --fields webhook_url | jq 'keys'

# Phase 13 ユーザー承認状態の確認
ls docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/

# 評価不能 if 代替設計の確認（UT-05 側に組み込まれているか）
grep -nE "if:.*always\(\).*secrets\." .github/workflows/{backend-ci,web-cd}.yml
# => 旧パターン（直接 secrets.X != ''）が残っていれば Phase 12 で UT-05 にフィードバック起票
```

| 確認項目 | 期待値 | NO-GO 条件 |
| --- | --- | --- |
| UT-05 (CI/CD pipeline) | merged | open / draft |
| workflow 参照キー 4 件 | 全件出現 | 欠落 / 別名 |
| UT-28 (Pages project) | 命名確定 | 未確定 |
| 01b (CF base bootstrap) | 1Password に値存在 | api_token_*/account_id 欠落 |
| Discord エントリ | 1Password に webhook_url 存在 | 欠落 |
| Phase 13 承認 | 取得済み | 未取得（Step 2〜5 実行禁止） |
| 評価不能 if 代替設計 | env 受け + シェル空文字判定 | 旧パターン残存 → Phase 12 unassigned へ |

**1 件でも NO-GO → 実装着手禁止 → Phase 3 NO-GO 経由で UT-05 / UT-28 / 01b 着手 へ。**

## 4. Step 1: 上流確認 inventory（lane 1 / 副作用なし）

```bash
grep -nE "secrets\.|vars\." .github/workflows/{backend-ci,web-cd}.yml \
  > /tmp/ut-27-workflow-keys.txt

op item get "Cloudflare" --vault UBM-Hyogo --format json --fields api_token_staging,api_token_production,account_id | jq 'keys'
op item get "Discord"    --vault UBM-Hyogo --format json --fields webhook_url | jq 'keys'

bash scripts/cf.sh pages project list
```

確認:

```bash
rg -c "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|DISCORD_WEBHOOK_URL|CLOUDFLARE_PAGES_PROJECT" /tmp/ut-27-workflow-keys.txt
# => 4 以上
```

> 結果は `outputs/phase-13/verification-log.md §upstream` に転記（**キー名・存在のみ / 値は記述しない**）。

## 5. Step 2: environment 作成（lane 2 / **Phase 13 ユーザー承認後のみ実行**）

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging    -X PUT --silent
gh api repos/daishiman/UBM-Hyogo/environments/production -X PUT --silent
```

確認:

```bash
gh api repos/daishiman/UBM-Hyogo/environments --jq '[.environments[].name] | sort'
# => ["production","staging"]
```

- T1 §3.1 #6 / #7（environment 2 件存在）が Green。
- 失敗時: 403 → `gh auth status` で `administration:write` スコープ確認 → `gh auth refresh -s admin:repo_hook,repo`。

> **コミット 1（Phase 13 別オペ側）**: `docs(cd): record UT-27 environments creation runbook`

## 6. Step 3: secret 配置（lane 3 / **Phase 13 ユーザー承認後のみ実行**）

### 6.1 one-shot `op read` ラッパーで投入

```bash
# repository-scoped Secret（2 件）
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$(op read 'op://UBM-Hyogo/Cloudflare/account_id')"
gh secret set DISCORD_WEBHOOK_URL   --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"

# environment-scoped Secret（CLOUDFLARE_API_TOKEN を staging / production 別 token で配置）
gh secret set CLOUDFLARE_API_TOKEN --env staging    --body "$(op read 'op://UBM-Hyogo/Cloudflare/api_token_staging')"
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$(op read 'op://UBM-Hyogo/Cloudflare/api_token_production')"
```

### 6.2 配置完了確認（T1 §3.1 #1〜#4）

```bash
gh secret list                          --json name --jq '[.[].name] | sort'
gh secret list --env staging            --json name --jq '[.[].name] | sort'
gh secret list --env production         --json name --jq '[.[].name] | sort'
```

### 6.3 scope boundary 確認（T2 / 同名併存禁止）

```bash
comm -12 \
  <(gh secret list                --json name --jq '.[].name' | sort) \
  <(gh secret list --env staging  --json name --jq '.[].name' | sort)
# => 出力空（積集合なし）

comm -12 \
  <(gh secret list                  --json name --jq '.[].name' | sort) \
  <(gh secret list --env production --json name --jq '.[].name' | sort)
# => 出力空（積集合なし）
```

### 6.4 1Password Last-Updated メモ更新（値ハッシュ記載禁止）

```bash
op item edit "Cloudflare" --vault UBM-Hyogo \
  notesPlain="Last-Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ) by UT-27 Phase 5 Step 3"
op item edit "Discord" --vault UBM-Hyogo \
  notesPlain="Last-Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ) by UT-27 Phase 5 Step 3"
```

> **コミット 2（Phase 13 別オペ側）**: `docs(cd): record UT-27 secrets sync runbook`

## 7. Step 4: variable 配置（lane 4 / **Phase 13 ユーザー承認後のみ実行**）

```bash
# UT-28 で確定したプロジェクト名
gh variable set CLOUDFLARE_PAGES_PROJECT --body "ubm-hyogo-web"
```

確認:

```bash
# T1 §3.1 #5（Variable 配置完了）
gh variable list --json name,value --jq '.[] | select(.name == "CLOUDFLARE_PAGES_PROJECT")'

# T2 §4.1（Variable 側のみ存在 / Secret 側に同名不在）
gh secret list --json name --jq '.[].name' | rg -v CLOUDFLARE_PAGES_PROJECT
```

> **コミット 3（Phase 13 別オペ側）**: `docs(cd): record UT-27 variables placement runbook`

## 8. Step 5: 動作確認 + 同期検証（lane 5 / **Phase 13 ユーザー承認後のみ実行**）

### 8.1 dev push smoke（T3）

```bash
git checkout dev
git pull --ff-only origin dev
git commit --allow-empty -m "chore(cd): trigger deploy-staging smoke [UT-27]"
git push origin dev

gh run watch
gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
gh run list --workflow web-cd.yml     --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'

# CLOUDFLARE_PAGES_PROJECT visibility（Variable のためマスクされない）
RUN_ID=$(gh run list --workflow web-cd.yml --branch dev --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --log | rg -F "$(gh variable get CLOUDFLARE_PAGES_PROJECT)"
```

### 8.2 Discord 未設定耐性（T4 ケース B）

```bash
gh secret delete DISCORD_WEBHOOK_URL
git commit --allow-empty -m "chore(cd): smoke without discord [UT-27]"
git push origin dev
gh run watch
gh run list --workflow backend-ci.yml --branch dev --limit 1 --json conclusion --jq '.[0].conclusion'
# => success（通知ステップが early-return）

# 復元（one-shot ラッパー）
gh secret set DISCORD_WEBHOOK_URL --body "$(op read 'op://UBM-Hyogo/Discord/webhook_url')"
```

| 観点 | 値 |
| --- | --- |
| 担当者 | solo 運用のため**実行者本人**（apply-runbook.md / verification-log.md に必須明記） |
| 連絡経路 | 手元 ssh / GitHub UI / Discord 通知失敗時は実行者本人が自前で復元 |
| 確認 | T4 ケース B（未設定耐性 / CI green 維持）が Green |
| 失敗時の起票先 | Phase 12 unassigned-task-detection.md（UT-05 に評価不能 if 代替設計のフィードバック） |

### 8.3 1Password 同期検証（T5）

```bash
op item get "Cloudflare" --vault UBM-Hyogo --format json | jq -r '.notes' | rg "Last-Updated"
op item get "Discord"    --vault UBM-Hyogo --format json | jq -r '.notes' | rg "Last-Updated"

gh secret list                  --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
gh secret list --env staging    --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
gh secret list --env production --json name,updatedAt --jq '.[] | select(.name == "CLOUDFLARE_API_TOKEN")'
```

> **コミット 4（Phase 13 別オペ側）**: `docs(cd): record UT-27 verification log (dev push smoke / discord resilience / op sync)`

## 9. one-shot ラッパーパターン早見表

| パターン | 例 | 採否 |
| --- | --- | --- |
| `$(op read ...)` 直接埋め込み | `gh secret set X --body "$(op read 'op://...')"` | ✅ 推奨（サブシェル揮発） |
| 一時 export + `unset` | `export TMP=$(op read ...); gh secret set X --body "$TMP"; unset TMP` | △ 次善（unset 漏れリスク） |
| `bash scripts/cf.sh ...`（Cloudflare 系） | `op run --env-file=.env` でラップ | ✅ Cloudflare 操作で推奨 |
| ファイル化 | `op read ... > /tmp/token` | ❌ 禁止（ディスク残存） |
| 引数直書き | `gh secret set X --body "actual-value"` | ❌ 禁止（history 残存） |

## 10. コミット粒度（4 分割 / Phase 13 別オペ側で実施）

| # | メッセージ | スコープ |
| --- | --- | --- |
| 1 | `docs(cd): record UT-27 environments creation runbook` | apply-runbook.md §environments |
| 2 | `docs(cd): record UT-27 secrets sync runbook` | apply-runbook.md §secrets / op-sync-runbook.md |
| 3 | `docs(cd): record UT-27 variables placement runbook` | apply-runbook.md §variables |
| 4 | `docs(cd): record UT-27 verification log (dev push smoke / discord resilience / op sync)` | verification-log.md / manual-smoke-log.md |

## 11. 実走境界（重要）

- **本ワークフローでは Step 2 / 3 / 4 / 5 の `gh api PUT` / `gh secret set` / `gh variable set` / `git push origin dev` を実行しない**。
- Step 1 は副作用なしの GET / grep / op field 存在確認のみで、Phase 13 承認前でも実走可能。ただし本 Phase の役割は仕様化のため、**実コマンドの実行は Phase 13 着手後の別オペレーションに限定**。
- 4 コミットも本ワークフローでは作成しない（Phase 13 ユーザー承認後の実走者が作成）。
- **secret 値**を Phase 5 outputs / runbook / 検証コマンド出力 / shell history / 1Password Notes（ハッシュ含む）に**一切転記しない**（AC-13）。

## 12. 引き渡し（Phase 6 へ）

- 4 コミット粒度の分離が Phase 6 異常系（401 / 404 / 同名併存 / Variable 誤 Secret 化 / 評価不能 if / 二重正本 drift）の前提
- Step 1 の上流確認 inventory が Phase 6 T6〜T11 系の入力
- Step 2〜5 の実 PUT / push 境界（Phase 13 ユーザー承認後のみ）が Phase 6 fail シナリオの実走条件
- T4 ケース B（未設定耐性）の workflow 代替設計が UT-05 に未組込なら Phase 12 unassigned-task-detection.md にフィードバック起票
