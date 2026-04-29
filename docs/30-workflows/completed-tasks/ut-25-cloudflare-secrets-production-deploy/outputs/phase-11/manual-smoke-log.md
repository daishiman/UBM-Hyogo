# Phase 11 manual-smoke-log — staging 投入リハーサル実行ログ

> **記録ルール**:
> - 実 secret 値・JSON 内容・`private_key` の片鱗を **絶対に転記しない**
> - `wrangler secret list` の name 行のみ転記可能
> - 1Password 参照は `op://<Vault>/<Item>/<Field>` のテンプレ表記のみ。実 vault path / item 名は記載しない
> - 実行時刻は ISO 8601（JST）で記録
> - 各 STEP の status は `EXECUTED` / `NOT EXECUTED` / `SKIPPED` のいずれかで明示

## 実行環境

| 項目 | 値 |
| --- | --- |
| 実行者 | <TBD: 実走者名> |
| 実行日時 | <TBD: YYYY-MM-DDTHH:MM:SS+09:00> |
| 実行ホスト | <TBD: macOS / Linux> |
| Node | <TBD: `mise exec -- node --version` の出力> |
| pnpm | <TBD: `mise exec -- pnpm --version` の出力> |
| wrangler | scripts/cf.sh 経由 |
| ブランチ | <TBD: feature/* のブランチ名> |

## STEP 0: 履歴汚染防止

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
set +o history
HISTFILE=/dev/null
export HISTFILE
```

| 確認 | 結果 |
| --- | --- |
| `echo $HISTFILE` | <TBD: /dev/null> |

## STEP 1: 投入前 list（同名 secret 有無確認）

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

期待結果: 旧 secret が存在する場合は name が、無い場合は空配列が返る。
実結果（name のみ転記可・値は転記禁止）:

```
<TBD: wrangler secret list 出力（name 行のみ）>
```

## STEP 2: op 経由 stdin 投入（staging）

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
```

期待結果: `✨ Successfully created secret for GOOGLE_SERVICE_ACCOUNT_JSON`
実結果（要約のみ・値は転記禁止）:

```
<TBD: 成功メッセージのみ（値は含めない）>
```

## STEP 3: 投入後 list（name 確認）

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

期待結果: `GOOGLE_SERVICE_ACCOUNT_JSON` が name として 1 件表示。
実結果（name 行のみ転記）:

```
<TBD: 例: GOOGLE_SERVICE_ACCOUNT_JSON  secret_text>
```

## STEP 4: rollback リハーサル（delete → 再 put）

### 4-A: delete

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON \
  --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

期待結果: list 出力に `GOOGLE_SERVICE_ACCOUNT_JSON` が含まれない。
実結果:

```
<TBD: 削除後 list 出力（name 行のみ）>
```

### 4-B: 再 put

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
op read "op://<Vault>/<Item>/<Field>" \
  | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
      --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
```

期待結果: 再投入成功 + list で `GOOGLE_SERVICE_ACCOUNT_JSON` が再び表示。
実結果:

```
<TBD: 再 put 後 list 出力（name 行のみ）>
```

## STEP 5: `.dev.vars` の `.gitignore` 除外確認（MINOR UT25-M-01 解決確認）

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
git check-ignore -v apps/api/.dev.vars
```

期待結果: `.gitignore` のいずれかの行にマッチして ignored と判定。
実結果:

```
<TBD: 例: .gitignore:NN:apps/api/.dev.vars\tapps/api/.dev.vars>
```

判定: <TBD: PASS / FAIL>

## STEP 6: 履歴汚染チェック

| 項目 | 値 |
| --- | --- |
| status | <TBD: EXECUTED / NOT EXECUTED> |
| time | <TBD> |

```bash
history | grep -E "BEGIN PRIVATE KEY|private_key" || echo "OK: no leak in history"
```

期待結果: `OK: no leak in history`
実結果: <TBD>

判定: <TBD: PASS / FAIL>

## production スキップ確認（重要）

| 項目 | 値 |
| --- | --- |
| `--env production` の実行記録 | **無い**（本 Phase スコープ外） |
| production への実投入 | Phase 13 deploy-runbook へ委譲 |

## 完了サマリー

| STEP | 結果 |
| --- | --- |
| STEP 0: 履歴汚染防止 | <TBD: PASS / FAIL> |
| STEP 1: 投入前 list | <TBD: PASS / FAIL> |
| STEP 2: op 経由投入 | <TBD: PASS / FAIL> |
| STEP 3: 投入後 list | <TBD: PASS / FAIL> |
| STEP 4-A: delete | <TBD: PASS / FAIL> |
| STEP 4-B: 再 put | <TBD: PASS / FAIL> |
| STEP 5: `.dev.vars` gitignore | <TBD: PASS / FAIL> |
| STEP 6: 履歴汚染チェック | <TBD: PASS / FAIL> |
| production スキップ | PASS（仕様により実走対象外） |

## 次 Phase 申し送り（Phase 12 へ）

- staging で確定したコマンド系列を `outputs/phase-12/implementation-guide.md` Part 2 へ転記
- 保証できない範囲（UT-26 機能疎通 / SA key 失効監視 / 定期ローテーション運用 / Cloudflare 監査ログ）を `outputs/phase-12/unassigned-task-detection.md` へ
- `link-checklist.md` の Broken 項目があれば Phase 12 で同 sprint 修正
