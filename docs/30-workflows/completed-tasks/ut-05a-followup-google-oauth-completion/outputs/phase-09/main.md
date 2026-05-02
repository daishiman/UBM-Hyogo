# Phase 9 主成果物 — 品質保証

> 仕様: `phase-09.md`

## セキュリティチェック

| 項目 | 検証 | 期待値 |
| --- | --- | --- |
| `.env` に実値混入 | `grep -E "^(AUTH_SECRET\|GOOGLE_CLIENT_(ID\|SECRET))=" .env \| grep -v "op://"` | 0 件 |
| `wrangler login` 呼び出し | `git grep "wrangler login" -- ':!docs/' ':!CLAUDE.md' ':!.claude/'` | 0 件 |
| ローカル wrangler token | `ls ~/Library/Preferences/.wrangler/config/default.toml` | "No such file" |
| client_secret 文字列の平文混入 | `git grep -nE "GOCSPX-\|sk-\|client_secret\":\".*\""` | 0 件 |
| Cloudflare API token 平文 | `git grep -n "CLOUDFLARE_API_TOKEN=[^o]"` | 0 件（`op://` 以外マッチなし） |

## screenshot セキュリティチェック

| 項目 | 検証 |
| --- | --- |
| screenshot 内に `Authorization` ヘッダ値が映っていない | 目視確認（Phase 11 完了時） |
| screenshot 内に `set-cookie` の session-token 値が映っていない | 目視確認 |
| Console screenshot で client_secret が "Hide" 状態 | 目視確認 |
| URL に `code=` / `state=` 残存していない | 目視確認 |

## 4 条件評価（Phase 11 実行前レビュー）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | DESIGN_PASS | B-03 解除と staging placeholder 解消の手順は定義済み。実解除は Phase 11 evidence 後 |
| 実現性 | DESIGN_PASS | `cf.sh` 単一経路で再現可能。実 Secret 投入は未実行 |
| 整合性 | DESIGN_PASS | 不変条件 / `02-auth.md` / `environment-variables.md` への参照方針は整合 |
| 運用性 | DESIGN_PASS | runbook + 段階間ゲート + 解除条件 a/b/c は定義済み |

> 判定語の注意: 本ファイルの PASS は設計レビュー上の `DESIGN_PASS` であり、OAuth flow / Google verification / production login の実測 PASS ではない。実測判定は Phase 11 の `outputs/phase-11/main.md` と `manual-test-result.md` でのみ確定する。

## 代替指標 実測値（Phase 11 完了後に追記）

| 指標 | 目標 | 実測 |
| --- | --- | --- |
| 手動 smoke PASS 率 | 100% | TBD（Phase 11 後） |
| evidence 配置率 | 100% | TBD |
| 設定整合率 | 100% | TBD |

> 実測値は Phase 11 実機実行後に本ファイルへ追記する。
