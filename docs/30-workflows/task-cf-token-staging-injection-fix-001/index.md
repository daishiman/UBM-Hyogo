# task-cf-token-staging-injection-fix-001

[実装区分: 実装仕様書 / 種別: NON_VISUAL / 監査・修復タスク]
[implementation_mode: "new"]

## 1. 背景と現象

- workflow: `.github/workflows/backend-ci.yml`
- job: `deploy-staging`（`if: github.ref_name == 'dev'`）
- step: `Apply D1 migrations`（uses: `cloudflare/wrangler-action@v3`）
- 失敗ログ要点:
  ```
  env:
    CLOUDFLARE_API_TOKEN:                       ← 空文字
    CLOUDFLARE_ACCOUNT_ID: b3dde7be1cd856788fc47595ac455475
  ...
  ✘ [ERROR] In a non-interactive environment, it's necessary to set a
  CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
  ```

## 2. 根本原因（確定）

**Secret 名のミスマッチ**。workflow YAML が参照している Secret 名と、実際に GitHub Environment に登録されている Secret 名が一致していない。未定義 Secret は GitHub Actions では空文字に解決されるため、`CLOUDFLARE_API_TOKEN: ` が空になっていた。

確認結果（2026-05-20 再確認済 / `gh secret list --env staging --repo daishiman/UBM-Hyogo` および同 `--env production`）:

| workflow が参照              | 実際の存在状況                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| `CF_TOKEN_D1_STAGING`        | 未登録                                                                |
| `CF_TOKEN_WORKERS_STAGING`   | 未登録                                                                |
| `CF_TOKEN_D1_PRODUCTION`     | 未登録                                                                |
| `CF_TOKEN_WORKERS_PRODUCTION`| 未登録                                                                |
| `CLOUDFLARE_API_TOKEN`       | staging / production 両 Environment に登録済（updated: about 20 days ago） |

## 2.1 解決方針

**Workflow 側を既存の `CLOUDFLARE_API_TOKEN` に合わせて書き換える**（ユーザー確認済み・2026-05-19）。

理由:
- 既存 Secret をそのまま使えるため即時復旧可能
- `CLAUDE.md` のシークレット管理ルール（`op://Vault/Item/Field` 参照）と命名が一致
- 最小権限分離（D1 / Workers 個別 token）は将来の rotation 設計タスクに切り出す（本タスクのスコープ外）

---

## 3. 実行手順（Step 0 → Step 12 の一本道）

各 Step は **(actor)** が誰の作業かを示す:
- **(user)** = ユーザーが GUI / ローカル shell で実施。Claude では代行不可。
- **(claude)** = Claude Code が自動実行する。

前提作業ディレクトリ: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260519-110923-wt-18`

> **前提（2026-05-20 確認済）**: `gh secret list --env staging|production --repo daishiman/UBM-Hyogo` で staging / production 両 Environment に `CLOUDFLARE_API_TOKEN` が登録済み（updated: about 20 days ago）であることを確認済み。**Secret の新規登録は不要**。Step 0 の権限確認も skip 可。Step 1 から始めて良い。

### Step 0. (user) token の権限確認【任意・推奨】

Cloudflare Dashboard → My Profile → API Tokens → 「`CLOUDFLARE_API_TOKEN` として 1Password に登録している token」を開く。
**Permissions** セクションに以下 3 つがあることを確認:

- `Account / D1 / Edit`
- `Account / Workers Scripts / Edit`
- `User / User Details / Read`

> Workers Routes は Cloudflare 上 **Zone レベル権限**（`Zone / Workers Routes / Edit`）として提供されており、Account スコープのドロップダウンには存在しない。本タスクで実行する `wrangler d1 migrations apply` / `wrangler deploy`（`apps/api` / `apps/web`）は Account スコープのみで完結するため Workers Routes 権限は不要。custom domain / zone route を CLI から付け替える運用が将来発生したタイミングで追加すれば良い。

不足している場合は token を Edit して権限を追加。再発行が必要な場合の手順:

1. Cloudflare Dashboard で token を「Roll」して新しい値を取得（旧 token は無効化される）
2. 1Password の該当 Item の `credential` フィールドを新値で上書き
3. GitHub Environment secret を新値で上書き登録（下記いずれか）

```bash
# 方式A: 対話入力（推奨・確実）
gh secret set CLOUDFLARE_API_TOKEN --env staging    --repo daishiman/UBM-Hyogo
gh secret set CLOUDFLARE_API_TOKEN --env production --repo daishiman/UBM-Hyogo
# → 「Paste your secret:」プロンプトに新 token をペースト
```

方式B（op CLI で 1Password から動的注入）の手順は **以下を 1 つのコードブロックとしてまとめてコピペする**こと（VAULT / ITEM 変数定義と `gh secret set` を別ブロックで実行すると空変数で展開され fail する）:

```bash
# 1. 該当 Item を一覧から確認（このプロジェクトでは Vault="Private" / Item="Cloudflare（senpai）"）
op item list --vault Private | grep -i cloudflare
# 出力例: 3kbwrhyecdptydy4iwgqzo7dia    Cloudflare（senpai）   ...

# 2. field 名を確認（"credential" / "password" / "token" 等 Item によって異なる）
op item get "Cloudflare（senpai）" --vault Private --format json | jq -r '.fields[] | "\(.label) (id=\(.id))"'

# 3. 変数を埋めて両 Environment に登録（コードブロック内で完結させる）
VAULT="Private"
ITEM="Cloudflare（senpai）"
FIELD="password"     # このプロジェクトでは "password"（2026-05-20 確認: email/password/notesPlain の 3 field 構成）
gh secret set CLOUDFLARE_API_TOKEN --env staging    --repo daishiman/UBM-Hyogo --body "$(op read "op://${VAULT}/${ITEM}/${FIELD}")"
gh secret set CLOUDFLARE_API_TOKEN --env production --repo daishiman/UBM-Hyogo --body "$(op read "op://${VAULT}/${ITEM}/${FIELD}")"
```

> **注意**: 上記コードブロックを **分割してコピペしない**こと。`gh secret set` 行だけを抜き出すと VAULT / ITEM が空のまま展開され `vault can't be empty` で fail する。不安なら方式A（対話入力）の方が確実。

権限が既に揃っているなら **何もしないで Step 1 へ進む**。

### Step 1. (claude) feature ブランチを切る

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260519-110923-wt-18
git fetch origin dev
git checkout -b fix/cf-token-staging-injection origin/dev
```

### Step 2. (claude) `.github/workflows/backend-ci.yml` の Secret 参照を置換

以下 4 種類の Secret 参照を `secrets.CLOUDFLARE_API_TOKEN` に一括置換する（`env:` と `with:` の両方で 2 重指定する現行構造はそのまま維持）:

| Before                                   | After                                |
| ---------------------------------------- | ------------------------------------ |
| `secrets.CF_TOKEN_D1_STAGING`            | `secrets.CLOUDFLARE_API_TOKEN`       |
| `secrets.CF_TOKEN_WORKERS_STAGING`       | `secrets.CLOUDFLARE_API_TOKEN`       |
| `secrets.CF_TOKEN_D1_PRODUCTION`         | `secrets.CLOUDFLARE_API_TOKEN`       |
| `secrets.CF_TOKEN_WORKERS_PRODUCTION`    | `secrets.CLOUDFLARE_API_TOKEN`       |

該当行（2026-05-19 時点の行番号。実コミット前に最新行と突き合わせること）:

- L41, L44（deploy-staging / Apply D1 migrations）
- L55, L58（deploy-staging / Deploy Workers app）
- L102, L105（deploy-production / Apply D1 migrations）
- L116, L119（deploy-production / Deploy Workers app）

### Step 3. (claude) preflight step を追加【再発防止】

`deploy-staging` job の `Apply D1 migrations` step の **直前** に以下を挿入:

```yaml
      - name: Preflight - verify Cloudflare secrets are injected
        env:
          CF_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CF_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          missing=0
          for var in CF_TOKEN CF_ACCOUNT_ID; do
            if [ -z "${!var}" ]; then
              echo "::error::'$var' is empty. Set CLOUDFLARE_API_TOKEN in GitHub Environment 'staging' (Settings → Environments → staging)."
              missing=1
            fi
          done
          if [ "$missing" -eq 1 ]; then exit 1; fi
          echo "OK: Cloudflare secrets injected (token length=${#CF_TOKEN})"
```

`deploy-production` job 側にも同じ step を挿入する（エラーメッセージ内の `'staging'` を `'production'` に置換）。

> 設計理由: secret 値そのものは echo せず length のみ表示。`wrangler` の non-interactive エラーは原因が分かりにくいため、自前で fail-fast させる方が再発時の調査コストが下がる。

### Step 4. (claude) ローカル静的検証

```bash
# YAML 構文（actionlint 未導入なら brew install actionlint）
actionlint .github/workflows/backend-ci.yml

# 置換漏れ確認: 0 件であること
grep -n "CF_TOKEN_D1_\|CF_TOKEN_WORKERS_" .github/workflows/backend-ci.yml

# CLOUDFLARE_API_TOKEN の出現箇所が 8 箇所（env + with × 4 step）あること
grep -nc "CLOUDFLARE_API_TOKEN" .github/workflows/backend-ci.yml
```

3 つすべて期待通りなら Step 5 へ。

### Step 5. (claude) commit

```bash
git add .github/workflows/backend-ci.yml docs/30-workflows/task-cf-token-staging-injection-fix-001/
git commit -m "$(cat <<'EOF'
fix(ci): unify Cloudflare secret reference to CLOUDFLARE_API_TOKEN

backend-ci.yml が参照していた CF_TOKEN_D1_* / CF_TOKEN_WORKERS_* は
GitHub Environment に未登録で空文字に解決されていた。staging /
production の両 Environment に存在する CLOUDFLARE_API_TOKEN に統一し、
deploy 前に空文字を fail-fast 検知する preflight step を追加する。

Refs: docs/30-workflows/task-cf-token-staging-injection-fix-001/
EOF
)"
```

### Step 6. (claude) push & PR 作成

```bash
git push -u origin fix/cf-token-staging-injection
gh pr create --base dev --title "fix(ci): unify Cloudflare secret reference to CLOUDFLARE_API_TOKEN" --body "$(cat <<'EOF'
## Summary
- backend-ci.yml の Secret 参照を `CLOUDFLARE_API_TOKEN` に統一（4 step / 8 箇所）
- deploy-staging / deploy-production に preflight fail-fast step を追加

## Why
GitHub Environment に未登録の `CF_TOKEN_*` を参照していたため `wrangler` が `CLOUDFLARE_API_TOKEN` 空文字で fail していた。

## Test plan
- [ ] PR の CI で lint / actionlint pass
- [ ] dev マージ後 `backend-ci / deploy-staging` が success
- [ ] `runtime-smoke-staging` も連鎖して success
EOF
)"
```

### Step 7. (claude) PR の CI 結果を確認

```bash
gh pr checks --watch
```

required check（lint / typecheck / actionlint 等）がすべて green になるまで待つ。
fail があれば Step 2-4 に戻って修正し、Step 5-6 の差分を追加 commit / push する。

### Step 8. (user) PR を dev にマージ

GitHub の PR 画面、または以下:

```bash
gh pr merge --squash --delete-branch
```

> solo 開発のためレビュー必須ではないが、CI required status check は全 green である必要がある。

### Step 9. (claude) dev 上の backend-ci 実行を監視

マージ完了直後に `dev` ブランチで `backend-ci` が自動起動する。

```bash
# 直近の run を確認
gh run list --workflow=backend-ci.yml --branch=dev --limit 3

# 監視
gh run watch <RUN_ID>
```

### Step 10. (claude) 成功確認

- `deploy-staging` job が success
  - `Preflight - verify Cloudflare secrets are injected` step が `OK: Cloudflare secrets injected (token length=...)` を出力していること
  - `Apply D1 migrations` / `Deploy Workers app` が両方 success
- 連鎖する `runtime-smoke-staging` workflow も success
- ログで `CLOUDFLARE_API_TOKEN` がマスクされていること:

```bash
gh run view <RUN_ID> --log | grep -i "CLOUDFLARE_API_TOKEN"
# 期待出力: CLOUDFLARE_API_TOKEN: ***
```

### Step 11. (claude) 失敗時の再実行

`deploy-staging` が失敗した場合、原因切り分け:

| 失敗内容                                          | 対処                                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| preflight が `CF_TOKEN is empty` で fail          | GitHub Environment `staging` に `CLOUDFLARE_API_TOKEN` が登録されていない → Step 0 末尾の `gh secret set` を実行 |
| `wrangler` が permission denied / 403             | token 権限不足 → Step 0 の Dashboard 確認に戻り、必要権限を追加して再発行 → 1Password / GitHub Secret を更新   |
| その他（network / D1 migration エラーなど）       | 当タスクのスコープ外。別タスクとして切り出す                                                                  |

修正後の再実行:

```bash
gh run rerun <RUN_ID> --failed
```

### Step 12. (claude) クローズ

DoD（§7）の全項目が ✅ になっていることを確認し、本タスクを `docs/30-workflows/completed-tasks/` に移動する PR を別途出す（命名規約は task-specification-creator skill 準拠）。

---

## 4. スコープ外

- `apps/api/wrangler.toml` の変更
- secret rotation 用 workflow の新設
- D1 / Workers 個別 token への分離（最小権限化）

---

## 5. テスト方針

CI workflow の変更のため、ローカル単体テストではなく実 CI 上での挙動確認で代替する（NON_VISUAL）。

| ケース        | 手順                                                                                | 期待結果                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| TC-01 正常系  | 修正を dev へ push（または `gh run rerun --failed`）                                | preflight が `OK: ...` を出力し、`Apply D1 migrations` と `Deploy Workers app` が両方 success。`runtime-smoke-staging` も連鎖して success |
| TC-02 構文確認 | ローカルで `actionlint .github/workflows/backend-ci.yml`                            | エラー 0                                                                                                          |
| TC-03 ログ確認 | `gh run view <RUN_ID> --log \| grep CLOUDFLARE_API_TOKEN`                          | `CLOUDFLARE_API_TOKEN: ***`（マスク済み）。空文字でない                                                          |

---

## 6. ローカル実行コマンド

```bash
# YAML 静的検証（actionlint 未導入なら brew install actionlint）
actionlint .github/workflows/backend-ci.yml

# 置換漏れ確認: 0 件であること
grep -n "CF_TOKEN_D1_\|CF_TOKEN_WORKERS_" .github/workflows/backend-ci.yml

# 期待行が 8 箇所あること（env + with × 4 step）
grep -nc "CLOUDFLARE_API_TOKEN" .github/workflows/backend-ci.yml
```

---

## 7. DoD (Definition of Done)

- [ ] `.github/workflows/backend-ci.yml` の 4 step・8 箇所が `secrets.CLOUDFLARE_API_TOKEN` に置換されている
- [ ] preflight step（§4.3）が deploy-staging / deploy-production に追加されている（任意採用の場合）
- [ ] `grep "CF_TOKEN_D1_\|CF_TOKEN_WORKERS_" .github/workflows/backend-ci.yml` が 0 件
- [ ] `actionlint` がエラー 0
- [ ] dev ブランチへの push で `backend-ci / deploy-staging` が success
- [ ] `runtime-smoke-staging` も連鎖して success
- [ ] CI ログで `CLOUDFLARE_API_TOKEN: ***`（マスク表示）になっていることを確認

---

## 8. ユーザー作業の要約（最重要）

**Claude では実施不可・必ずユーザーが手動でやること:**

1. （任意）Cloudflare Dashboard で `CLOUDFLARE_API_TOKEN` の権限に D1 / Workers Scripts / Workers Routes / User Details が含まれているか確認
2. workflow 修正マージ後、`gh run rerun <RUN_ID> --failed` で失敗 run を再実行
3. ログで `CLOUDFLARE_API_TOKEN: ***` を確認

**Claude / コード側で実施すること:**

- `.github/workflows/backend-ci.yml` の Secret 参照置換 + preflight step 追加（§4.2 / §4.3）

---

## 9. 参照

- 失敗 PR: #491
- 関連 workflow: `runtime-smoke-staging.yml`（`deploy-staging` 成功時のみ走る）
- 関連 doc: `CLAUDE.md` §シークレット管理 / §Cloudflare 系 CLI 実行ルール
- 既存 token rotation 監視: `.github/workflows/cf-token-rotation-reminder.yml`
