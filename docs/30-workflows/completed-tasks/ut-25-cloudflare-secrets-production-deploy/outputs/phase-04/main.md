# Phase 4 成果物 — テスト戦略

## 1. テスト戦略サマリ

UT-25 は実コード実装を伴わない手動 secret 配置オペレーションのため、**ユニットテストは存在しない**。代わりに 5 件のオペレーション検証（T1〜T5）で品質を担保する。機能疎通（値の正当性 / Sheets API 認証成功）は **UT-26 に完全委譲** する。

| ID | 観点 | 対応 lane | 対応 AC | 対応 MINOR |
| --- | --- | --- | --- | --- |
| T1 | name 確認 | lane 2 / 3 | AC-5 | - |
| T2 | `.gitignore` 静的検査 | lane 1 | AC-6 | UT25-M-01 |
| T3 | `--env` 漏れ予防チェック | lane 2 / 3 | AC-2 | UT25-M-02（予防） |
| T4 | stdin 改行保全（手順検証） | lane 2 / 3 | AC-3 | - |
| T5 | rollback リハーサル | lane 2 / 3 | AC-7 | - |

> **本 Phase は仕様化のみ**。実 `wrangler secret put` / `secret delete` は Phase 13 ユーザー承認後の別オペレーション。

## 2. 機能検証境界（UT-26 委譲）

| 検証種別 | UT-25 | UT-26 |
| --- | --- | --- |
| secret 名の存在 | T1 で name 確認 | - |
| 改行 / JSON valid | T4 で put 前 jq 検査（構造的保証） | Sheets API 認証成功で実証 |
| `private_key` 復号 | - | 401/403 が返らないことで実証 |
| Sheets API E2E | - | smoke test |

## 3. T1: `wrangler secret list` name 確認

| 項目 | 内容 |
| --- | --- |
| 対象 | lane 2 / 3 |
| 検証コマンド | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \| tee outputs/phase-13/secret-list-evidence-staging.txt \| grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'` / 同 production |
| 期待値 | grep exit 0 / evidence ファイルに name 記録（値非表示） |
| Red 状態 | grep exit 1 / evidence ファイル未生成 |
| 失敗時切り分け | (a) `--env` 別環境 / (b) put 自体失敗 / (c) op read 空 stdin |

## 4. T2: `.gitignore` 静的検査（UT25-M-01）

| 項目 | 内容 |
| --- | --- |
| 対象 | lane 1 |
| 検証コマンド | `grep -E '^\.dev\.vars$' apps/api/.gitignore` + `git check-ignore apps/api/.dev.vars` + `git status -uno` |
| 期待値 | 全 3 確認で exit 0 相当（除外 OK / untracked に出ない） |
| Red 状態 | 除外漏れ / 過剰一致 / 履歴に commit 済 |
| 失敗時切り分け | (a) `apps/api/.gitignore` 不在 → 新規作成 / (b) パターン過剰 → 厳密化 / (c) 過去 leak → `git rm --cached` |

## 5. T3: `--env` 漏れ予防チェック（UT25-M-02 予防）

| 項目 | 内容 |
| --- | --- |
| 対象 | lane 2 / 3（put 実行前） |
| 検証コマンド | (1) `grep -E '^\[env\.(staging\|production)\]' apps/api/wrangler.toml` → (2) `echo "$ENV_TARGET"` で `--env` 変数を確認 → (3) put 後 list を同 `$ENV_TARGET` で読み返し |
| 期待値 | env 宣言 2 ブロック存在 / `$ENV_TARGET` が `staging` `production` のいずれかと完全一致 / list で name 出現 |
| Red 状態 | `--env` 引数省略 / typo（`dev` `prod` `prd`）/ 空文字 |
| 失敗時切り分け | (a) 省略 → top-level 投入事故（Phase 6 異常系本体）/ (b) typo → wrangler エラー / (c) 異常系実走は Phase 6 T8 |

## 6. T4: stdin 改行保全（手順検証）

| 項目 | 内容 |
| --- | --- |
| 対象 | lane 2 / 3 |
| 検証コマンド | (1) `op read 'op://Vault/SA-JSON/credential' \| jq -e 'has("private_key")'` → (2) `op read ... \| jq -r '.private_key' \| grep -c 'BEGIN PRIVATE KEY'` |
| 期待値 | (1) exit 0 / (2) >=1 ヒット |
| Red 状態 | jq parse error / `BEGIN PRIVATE KEY` が 0 ヒット |
| 失敗時切り分け | (a) 1Password 保管時の改行エスケープ → Item 再保存 / (b) `cat sa.json`（D2）に切替 / (c) tty 直接入力（D3）は採用しない |

## 7. T5: rollback リハーサル（delete + 再 put / E1）

| 項目 | 内容 |
| --- | --- |
| 対象 | lane 2 / 3（Phase 13 承認後のみ実走） |
| 検証コマンド | (1) `bash scripts/cf.sh secret delete GOOGLE_SERVICE_ACCOUNT_JSON --env staging` → (2) list で name 消失確認 → (3) `op read 'op://Vault/SA-JSON-prev/credential' \| bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --env staging` → (4) list で name 復活確認 |
| 期待値 | 4 ステップ exit 0 / 中間 list で name 不在を確認可能 |
| Red 状態 | delete 後も list 残存 / 旧 key 不在で再投入不能 / production 先行 rollback |
| 失敗時切り分け | (a) 旧バージョン未保管 → ローテーション運用見直し / (b) Workers 認証失敗 → UT-26 で検出 / (c) 上書き put（E2）退化禁止 |

## 8. テストカバレッジマップ

| AC / MINOR | 被覆テスト |
| --- | --- |
| AC-2（staging-first 順序 + `--env` 切替） | T3（予防）/ Phase 6 T8（異常系） |
| AC-3（改行保全） | T4 |
| AC-4（履歴汚染防止） | runbook 規約として固定（`set +o history` + op stdin pipe） |
| AC-5（name 確認） | T1 |
| AC-6（`.dev.vars` gitignore） | T2 |
| AC-7（rollback delete + 再 put） | T5 |
| UT25-M-01（gitignore smoke 必須化） | T2 |
| UT25-M-02（`--env` 漏れ） | T3（予防） / Phase 6 T8（実走） |

## 9. 引き渡し（Phase 5 へ）

- T1〜T5 を Phase 5 各 Step の Green 条件として転記
- T2 / T3 は put 実行前の事前チェックとして必須
- T5 は staging で完結（production rollback リハーサルは実走しない）
- 機能疎通は UT-26 に委譲
- 実走は Phase 13 ユーザー承認後
