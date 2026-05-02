# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 5 |
| 状態 | spec_created |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 2 で確定した必要最小権限マトリクスを Cloudflare Dashboard で発行する。
2. staging → production の順で段階的に Token を差し替え、各段階で TC-R / TC-P を確認する。
3. 旧 Token は 24h 保持し、CI 異常検知時は値ロールバックする。
4. Token 値・Account 情報を成果物・ログに残さない。

## 目的

「コード実装」ではなく **運用ランブック** として、Token 再発行 → Secret 更新 → smoke → 旧 Token 失効までの手順を再現可能な形で記述する。

## 参照資料

- `index.md`
- `artifacts.json`
- `phase-02.md`（権限マトリクス・適用順序）
- `phase-04.md`（テスト戦略）
- `scripts/cf.sh`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/web-cd.yml`
- Cloudflare Dashboard: My Profile → API Tokens

## 入力

- Phase 2 成果物（正本 4 種マトリクス + 条件付き追加候補）
- Phase 4 成果物（Static / Runtime / Negative TC）
- 既存 Secret: `CLOUDFLARE_API_TOKEN`（staging / production）

## 新規作成 / 修正ファイル一覧

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 修正なし | - | 本タスクは Cloudflare Dashboard と GitHub Secret の値更新のみ。リポジトリ内ファイルは変更しない |
| 成果物 | outputs/phase-05/main.md | ランブック実行ログ（Token 値除く） |

## Token 命名規約

| 環境 | 命名 | 用途 |
| --- | --- | --- |
| staging | `ubm-hyogo-staging-cicd-YYYYMMDD` | staging 環境の wrangler 認証 |
| production | `ubm-hyogo-prod-cicd-YYYYMMDD` | production 環境の wrangler 認証 |

`YYYYMMDD` は発行日。命名は Cloudflare Dashboard 上のラベルのみで、GitHub Secret 名は引き続き `CLOUDFLARE_API_TOKEN` を維持する。

## 必要権限テンプレート（再掲）

| カテゴリ | 権限 | 理由 |
| --- | --- | --- |
| Account | Workers Scripts:Edit | Workers deploy |
| Account | D1:Edit | migration apply |
| Account | Cloudflare Pages:Edit | Pages deploy |
| Account | Account Settings:Read | wrangler whoami / account 解決 |

追加候補: `Workers KV Storage:Edit` / `User Details:Read` は、Phase 11 の staging smoke で 4 権限だけでは失敗した場合に限り、根拠ログとともに追加する。

Account Resources は `Include - Specific account - <UBM-Hyogo account>` のみに絞る。Zone Resources は `Include - All zones from an account - <UBM-Hyogo account>`、ただしゾーン未利用なら `All zones` を選択しない（最小化）。Client IP Address Filtering / TTL は MVP では未設定。

## 実行手順

### Step 1: 事前確認

```bash
# 1-A: 既存 Secret 名の存在確認（値は出さない）
gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets \
  | jq '.secrets[] | select(.name=="CLOUDFLARE_API_TOKEN") | .name'
gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \
  | jq '.secrets[] | select(.name=="CLOUDFLARE_API_TOKEN") | .name'

# 1-B: 利用箇所の grep（TC-S01 / S02）
grep -rn 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/
grep -rn 'CLOUDFLARE_API_TOKEN' apps/ scripts/

# 1-C: 現行 Token の権限を Dashboard で確認しスクリーンショット禁止／権限名のみテキスト記録
```

### Step 2: staging 用 Token 新規発行

1. Cloudflare Dashboard → My Profile → API Tokens → "Create Token" → "Custom token"
2. Token name: `ubm-hyogo-staging-cicd-YYYYMMDD`
3. Permissions に上記 4 種を 1 行ずつ追加（条件付き候補は Phase 11 で必要と判明した場合のみ追加）
4. Account Resources: `Include - <UBM-Hyogo>` のみ
5. "Continue to summary" → "Create Token"
6. **Token 値が表示される画面**: Value をクリップボードへコピー（成果物に貼り付け禁止）
7. すぐに次 Step へ進み、コピーした値はメモリ／プロセスにのみ保持する

### Step 3: staging Secret 差し替え

```bash
# クリップボードの Token 値を gh secret set にパイプ（履歴に残らない方法）
gh secret set CLOUDFLARE_API_TOKEN --env staging --body "$(pbpaste)"
# pbpaste 経由の値はシェル変数に残さない。コマンド完了後にクリップボードをクリア
pbcopy < /dev/null
```

### Step 4: staging 検証（TC-R01〜R06）

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
bash scripts/cf.sh kv namespace list
```

すべて exit=0 を確認。失敗時は Step 7（rollback）。

### Step 5: production 用 Token 新規発行

Step 2 と同手順で `ubm-hyogo-prod-cicd-YYYYMMDD` を発行する。**旧 production Token はまだ失効させない**（rollback 用に 24h 保持）。

### Step 6: production Secret 差し替え + main 監視

```bash
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$(pbpaste)"
pbcopy < /dev/null

# main への deploy をトリガする最初の merge / dispatch を観測
gh run list --branch main --workflow=backend-ci --limit 1
gh run list --branch main --workflow=web-cd --limit 1
```

24h 観測ウィンドウで TC-P01〜P03 を確認する。失敗時は Step 7。

### Step 7: rollback 手順

1. 1Password 正本に残る直近有効 Token を `op read` で読み、`gh secret set` に標準入力で再注入する
2. 1Password 正本が旧値を保持していない場合は「旧値復元」ではなく Cloudflare Dashboard で新しい最小権限 Token を再発行し、staging から T0 として再開する
3. `gh run rerun <run-id>` で失敗 run を再実行
4. 成功確認後、原因調査（権限不足カテゴリの特定）→ Phase 6 異常系分類に従って差分修正

> 注: Cloudflare API Token は 1 度だけ平文表示される。値を成果物に残して rollback する運用は禁止する。rollback 可否は 1Password 正本に直近有効値があるかで決まり、ない場合は再発行で復旧する。

### Step 8: 旧 Token 失効

24h 観測で異常 0 件確認後、Cloudflare Dashboard → API Tokens で旧 Token を Delete。1Password 一時項目も削除。

## Token 値非記録ガード

- ランブック実行中、Token 値を含む可能性のあるコマンド出力を `tee` / `pbcopy` / file リダイレクトしない。
- ターミナル履歴に Token 値が含まれる可能性があるため、Step 3 / 6 完了後に `history -c`（zsh）でクリア。
- 成果物 `outputs/phase-05/main.md` には「Token 名」「権限名」「実行コマンド」「exit code」のみを記録する。

## 統合テスト連携

- アプリケーション統合テストは追加しない。
- 検証は scripts/cf.sh dry-run / `gh run list` で代替する。

## 完了条件

- [ ] staging Token が正本 4 権限のみで発行されている（追加候補は実測根拠がある場合のみ）
- [ ] staging で TC-R01〜R06 全 PASS
- [ ] production Token が同条件で発行されている
- [ ] production main run TC-P01〜P03 全 PASS（24h 観測）
- [ ] 旧 Token が失効されている
- [ ] 成果物に Token 値が含まれていない（TC-S06 / TC-N04 で確認）

## 成果物

- `outputs/phase-05/main.md`
