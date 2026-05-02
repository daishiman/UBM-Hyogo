# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Phase | 5 |
| 状態 | spec_created（実行は Phase 11 ユーザー明示承認後） |
| taskType | implementation |
| subtype | security-audit |
| visualEvidence | NON_VISUAL |
| 上流 | outputs/phase-02/main.md, outputs/phase-04/main.md |
| 下流 | outputs/phase-06/main.md, outputs/phase-11/main.md |

## 1. 目的

「コード実装」ではなく **運用ランブック** として、Token 再発行 → Secret 更新 → smoke → 旧 Token 失効までの手順を再現可能な形で記述する。本 Phase は spec_created 段階のため、Token 値の実書き換えは Phase 11 ユーザー明示承認後に限る。

## 2. 新規作成 / 修正ファイル一覧

| 種別 | パス | 変更概要 |
| --- | --- | --- |
| 修正なし | - | 本タスクは Cloudflare Dashboard と GitHub Secret の値更新のみ。リポジトリ内ファイルは変更しない |
| 成果物 | outputs/phase-05/main.md | 本ランブック仕様 |
| 成果物 | outputs/phase-11/main.md | 実行ログ（Token 値・Account ID は記録しない） |

## 3. Token 命名規約

| 環境 | 命名 | 用途 |
| --- | --- | --- |
| staging | `ubm-hyogo-staging-cicd-YYYYMMDD` | staging 環境の wrangler 認証 |
| production | `ubm-hyogo-prod-cicd-YYYYMMDD` | production 環境の wrangler 認証 |

`YYYYMMDD` は発行日。Cloudflare Dashboard 上のラベルのみで、GitHub Secret 名は引き続き `CLOUDFLARE_API_TOKEN`（環境スコープ）を維持する。

## 4. 必要権限テンプレート（Phase 2 から再掲）

| カテゴリ | 権限 | 理由 |
| --- | --- | --- |
| Account | Workers Scripts:Edit | Workers deploy（apps/api / apps/web の Worker bundle） |
| Account | D1:Edit | migration apply（apps/api 配下のスキーマ） |
| Account | Cloudflare Pages:Edit | Pages deploy（apps/web の OpenNext bundle） |
| Account | Account Settings:Read | `wrangler whoami` / account 解決 |

追加候補: `Workers KV Storage:Edit` / `User Details:Read` は、Phase 11 staging smoke で 4 権限のみで失敗した場合に限り、根拠ログ付きで追加する（TC-R06 / FC-05 / FC-06）。

Resources 設定:
- Account Resources: `Include - Specific account - <UBM-Hyogo account>`
- Zone Resources: `All zones from an account` を**選択しない**（CI でゾーン操作なし）
- Client IP Address Filtering / TTL: MVP では未設定

## 5. 実行手順（T0〜T5）

Phase 2 の適用順序図 (T0〜T5) と対応する。

### Step 1（T0 前提）: 事前確認

```bash
# 1-A: 既存 Secret 名の存在確認（値は出さない）
gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets \
  | jq '.secrets[] | select(.name=="CLOUDFLARE_API_TOKEN") | .name'
gh api repos/daishiman/UBM-Hyogo/environments/production/secrets \
  | jq '.secrets[] | select(.name=="CLOUDFLARE_API_TOKEN") | .name'

# 1-B: 利用箇所の grep（TC-S01 / TC-S02）
grep -rn 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/
grep -rn 'CLOUDFLARE_API_TOKEN' apps/ scripts/

# 1-C: 現行 Token の権限を Dashboard で確認
#       - 値の表示は不可（既発行 Token は再表示されない）。権限名のみテキストでメモする
#       - スクリーンショットを撮る場合は Account ID 部分を黒塗り
```

### Step 2（T1）: staging 用 Token 新規発行

1. Cloudflare Dashboard → My Profile → API Tokens → "Create Token" → "Custom token"
2. Token name: `ubm-hyogo-staging-cicd-YYYYMMDD`
3. Permissions に正本 4 種を追加（追加候補 2 種は付与しない）
4. Account Resources: `Include - <UBM-Hyogo>` のみ
5. "Continue to summary" → "Create Token"
6. **Token 値が表示される画面**: Value をクリップボードへコピー（成果物に貼り付け禁止）
7. すぐに次 Step へ進み、コピーした値はメモリ／プロセスにのみ保持する

### Step 3（T1 完了）: staging Secret 差し替え（stdin 経由・履歴に残さない）

```bash
# クリップボードの Token 値を gh secret set に stdin 経由で渡す。
# 値はシェル変数や履歴・ログに残さない。
pbpaste | gh secret set CLOUDFLARE_API_TOKEN --env staging

# クリップボードを即時クリア
pbcopy < /dev/null

# 履歴除去（zsh）
history -c 2>/dev/null || true
```

> 注: `--body "$(pbpaste)"` ではなく `pbpaste | gh secret set ... --env staging` の **stdin 経路**を必ず使う。`--body` は引数文字列としてプロセスリスト (`ps -ef`) に一時的に露出する可能性があるため。`gh` は stdin が tty でない場合、stdin から body を読む仕様。

### Step 4（T2）: staging 検証（TC-R01〜R06）

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run
bash scripts/cf.sh kv namespace list   # TC-R06: 失敗時のみ追加候補要否を判定
```

すべて exit=0 を確認。失敗時は Step 7（rollback）。

### Step 5（T3）: production 用 Token 新規発行

Step 2 と同手順で `ubm-hyogo-prod-cicd-YYYYMMDD` を発行する。**旧 production Token はまだ失効させない**（rollback 用に最大 24h 保持）。

### Step 6（T4）: production Secret 差し替え + main 監視

```bash
pbpaste | gh secret set CLOUDFLARE_API_TOKEN --env production
pbcopy < /dev/null
history -c 2>/dev/null || true

# main への deploy をトリガする最初の merge / dispatch を観測
gh run list --branch main --workflow=backend-ci --limit 1 --json conclusion,createdAt
gh run list --branch main --workflow=web-cd     --limit 1 --json conclusion,createdAt
```

24h 観測ウィンドウで TC-P01〜P03 を確認する。失敗時は Step 7。

### Step 7（rollback）: 失敗時の復旧手順

1. **直近有効 Token が 1Password 正本にある場合**:
   ```bash
   # 値を画面に出さず stdin 経由で再注入
   op read "op://<vault>/<item>/credential" | gh secret set CLOUDFLARE_API_TOKEN --env <staging|production>
   ```
2. **1Password 正本に旧値が無い場合**:
   - Cloudflare Dashboard で**新しい最小権限 Token を再発行**し、Step 2 / Step 5 と同手順で再開する。
   - Cloudflare API Token は 1 度しか平文表示されないため、「旧値復元」は前提にしない。
3. `gh run rerun <run-id>` で失敗 run を再実行。
4. 成功確認後、原因調査（権限不足カテゴリの特定）→ Phase 6 異常系 FC-01〜FC-04 に従って差分修正（権限を Dashboard で編集して追加 → 再検証）。

> 注: rollback 中も `set -x` を使わない・Token 値を環境変数や `--body` に置かない。

### Step 8（T5）: 旧 Token 失効

24h 観測で異常 0 件確認後、Cloudflare Dashboard → API Tokens で旧 Token を **Delete**。1Password 一時項目（あれば）も削除。

## 6. Token 値非記録ガード

- ランブック実行中、Token 値を含む可能性のあるコマンド出力を `tee` / `pbcopy` / file リダイレクトしない。
- ターミナル履歴に Token 値が含まれる可能性があるため、Step 3 / Step 6 完了後に `history -c` でクリア。
- 成果物 `outputs/phase-05/main.md` および `outputs/phase-11/main.md` には「Token 名」「権限名」「実行コマンド」「exit code」「日時」のみを記録する。
- `--body "<value>"` の引数渡し禁止。stdin 経由 (`pbpaste | gh secret set ...` または `op read ... | gh secret set ...`) のみ使用。

## 7. 統合テスト連携

- アプリケーション統合テストは追加しない。
- 検証は `scripts/cf.sh` dry-run / `gh run list` で代替する。
- D1 への直接アクセスは `apps/api` の migration 経由のみ（不変条件 #5 維持）。

## 8. AC マッピング（Phase 5 内 完結分）

| AC | 本 Phase での貢献 |
| --- | --- |
| AC-3, AC-4, AC-5 | Step 4 (staging T2) で TC-R03〜R05 を実測 |
| AC-6 | Step 1〜8 が T0〜T5 適用順序を Runbook 化 |
| AC-7 | Step 7 が rollback 手順を提供 |
| AC-8 | §6 Token 値非記録ガード |
| AC-12 | Step 1-A の `gh api ... /environments/.../secrets` 確認 |

## 9. 完了条件

- [ ] staging Token が正本 4 権限のみで発行されている（追加候補は実測根拠がある場合のみ）
- [ ] staging で TC-R01〜R06 全 PASS
- [ ] production Token が同条件で発行されている
- [ ] production main run TC-P01〜P03 全 PASS（24h 観測）
- [ ] 旧 Token が失効されている
- [ ] 成果物に Token 値が含まれていない（TC-S06 / TC-N04 で確認）

## 10. 成果物

- 本ファイル: `outputs/phase-05/main.md`
