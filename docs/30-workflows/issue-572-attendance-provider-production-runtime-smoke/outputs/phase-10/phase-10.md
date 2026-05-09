# Phase 10 正本: デプロイ前準備（user gate / production 実行 runbook）

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 親 Issue | #572 (CLOSED) |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11 で 1 回だけ走る production GET smoke のために、

- user 明示承認（G1）取得手順
- production session 値の取得・利用・破棄シーケンス（`read -s` + `unset` + 履歴抑止）
- `wrangler` binding diff 確認手順（staging vs production）
- production smoke runbook（`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`）

を完成形として確定する。

## 変更対象ファイル

| パス | 変更種別 | 役割 |
| --- | --- | --- |
| `docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` | 新規 | production smoke 実行 runbook（本 Phase で完成） |
| `docs/30-workflows/issue-572-attendance-provider-production-runtime-smoke/outputs/phase-10/phase-10.md` | 新規 | 本ファイル |
| `apps/api/scripts/runtime-smoke/run-smoke.sh` | 編集 | `--env production` 経路の最終整合（Phase 8 で仕様確定済） |

## Step 0: 前提確認

```bash
test -f apps/api/wrangler.toml
grep -q '\[env.production\]' apps/api/wrangler.toml
test -x scripts/cf.sh
which jq && which rg
```

## 10-A. user gate G1 取得文面（テンプレ）

Phase 11 を着手する直前に、ユーザーへ以下の文面で確認を取り、回答を `outputs/phase-11/g1-approval.md` に保存する（実値・本名は記録しない。承認の事実と timestamp のみ）。

```
[G1 production smoke 承認確認]
本タスク (#572) では production の以下 endpoint に対して
read-only GET smoke を 1 回だけ実行します:

  - GET https://<production-api-host>/admin/members?limit=5
  - GET https://<production-api-host>/admin/members/:memberId
  - GET https://<production-api-host>/me/profile

副作用: なし（GET のみ）。evidence は summary-only で保存し、
session cookie / Bearer / cf-* token / OAuth secret /
email / fullName / profile body 実値は一切記録しません。

実行を承認しますか？ (yes / no)
```

| 項目 | 保存形式 |
| --- | --- |
| 承認結果 | `yes` / `no` |
| 承認 timestamp（UTC） | `2026-05-08T12:34:56Z` |
| 確認文面 hash | `sha256:...`（文面の改ざん検出用） |

> 実 cookie / token / email / fullName は **G1 の保存対象に含めない**。

## 10-B. production session 値取得・破棄シーケンス

production session 値（admin / 一般会員それぞれの session cookie）は **新規 terminal tab + Cloudflare 専用 shell session** で取得し、利用後に必ず `unset` し、履歴ファイル / scrollback に残らないようにする。

```bash
# 1) 新規 terminal tab を開く（既存 tab の history 流用を避ける）
#    本セッションでのみ HISTFILE を一時無効化
export HISTFILE=/dev/null
unset HISTSIZE
set +o history   # bash の場合。zsh は: setopt HIST_IGNORE_SPACE && setopt NO_HISTSAVE

# 2) production API URL を 1Password から取得（実値はファイルに書かない）
export PRODUCTION_API_URL="$(op read 'op://UBM-Hyogo/production-api/url')"
echo "URL set: $(printf '%s' "$PRODUCTION_API_URL" | wc -c) chars"

# 3) admin session cookie を read -s で取得（echo back されない）
read -rs -p "Paste production admin session cookie: " ADMIN_COOKIE
echo
read -rs -p "Paste production member session cookie: " MEMBER_COOKIE
echo

# 4) smoke 実行（Phase 11 で実行）
bash apps/api/scripts/runtime-smoke/run-smoke.sh \
  --env production \
  --admin-cookie-env ADMIN_COOKIE \
  --member-cookie-env MEMBER_COOKIE \
  --readonly \
  2>&1 | tee outputs/phase-11/production-smoke.log

# 5) 後始末（必須）
unset ADMIN_COOKIE MEMBER_COOKIE PRODUCTION_API_URL
set -o history   # 復帰（bash）
# scrollback クリア（terminal 依存）: Cmd+K (macOS Terminal/iTerm) で手動
```

`run-smoke.sh` への session 値の渡し方は **環境変数名で渡す**（コマンドラインに値を直接書かない → `ps aux` / shell 履歴に値が残らない）。

## 10-C. STAGING / PRODUCTION URL 取り違え防止

| 防御層 | 仕様 |
| --- | --- |
| 専用 terminal tab | production smoke は新規 tab で起動。staging で使った tab を再利用しない |
| URL prefix 検証 | `run-smoke.sh` 起動時に `PRODUCTION_API_URL` が `https://api.<production-domain>` で始まることを assert。staging host を含む場合は exit 2 |
| `--env` 引数必須 | 引数省略は exit 3。staging / production の暗黙的選択を不可とする |
| dry-run 強制 first | `--env production` 初回起動は `--dry-run` を要求。明示的に `--no-dry-run` を付けない限り real call しない |

## 10-D. wrangler binding diff 確認

`apps/api/wrangler.toml` の `[env.staging]` と `[env.production]` の binding 差異を Phase 11 着手前に確認する:

```bash
# 1) staging / production の binding を dump
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run \
  2>&1 | tee outputs/phase-10/wrangler-staging-bindings.log
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run \
  2>&1 | tee outputs/phase-10/wrangler-production-bindings.log

# 2) binding 差分を抽出（D1 / KV / R2 / Queues / Secrets 名）
diff \
  <(grep -E '^(d1_databases|kv_namespaces|r2_buckets|queues|services)' outputs/phase-10/wrangler-staging-bindings.log | sort) \
  <(grep -E '^(d1_databases|kv_namespaces|r2_buckets|queues|services)' outputs/phase-10/wrangler-production-bindings.log | sort) \
  | tee outputs/phase-10/binding-diff.log

# 3) 期待: 名前空間（database_name / bucket name 等）の env 接尾辞のみ差分
#         binding 名（d1_databases.binding 値）は同一であること
```

差分が想定外（binding 名そのものが異なる、片方にのみ存在する binding がある）の場合、Phase 11 着手を停止し、Phase 5（wrangler config）に戻る。

## 10-E. production smoke runbook 章構成

`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md` の章構成を以下で確定:

| § | 章 | 内容 |
| --- | --- | --- |
| 1 | 概要 / 適用範囲 | issue-572 / issue-371 完了化のため、`/admin/members*` と `/me*` への read-only GET smoke を 1 回だけ実行 |
| 2 | 前提条件 | Phase 8 staging リハーサル PASS / Phase 9 全 gate clean / G1 承認取得済 |
| 3 | G1 user 承認取得 | 10-A の文面で確認、`outputs/phase-11/g1-approval.md` に保存 |
| 4 | session 値取得 | 10-B のシーケンス（HISTFILE 抑止 / `read -s` / 環境変数経由） |
| 5 | wrangler binding diff 確認 | 10-D 手順 |
| 6 | smoke 実行 | `run-smoke.sh --env production --readonly`（最初は `--dry-run`） |
| 7 | evidence 保存 | summary-only log を `outputs/phase-11/production-smoke.log` に保存。redact grep 0 hit 確認 |
| 8 | session 値破棄 | `unset` + scrollback クリア + tab close |
| 9 | rollback / 失敗時対応 | smoke 失敗 → issue-371 昇格を保留 / Phase 8 へ戻る |
| 10 | 後始末 | G1 evidence と smoke log を artifacts.json に登録、aiworkflow-requirements 同期 |

## 10-F. 実行禁止経路

| 経路 | 禁止理由 |
| --- | --- |
| CI からの production smoke 起動 | session 値を CI に保持するリスク。runbook の手動経路に閉じる |
| pre-commit / pre-push hook での起動 | 偶発実行リスク |
| cron / scheduled trigger | 同上 |
| `wrangler` 直接呼び出し | `scripts/cf.sh` ラッパに統一（CLAUDE.md 既定） |

## テスト/検証方針

| ID | 観点 | 検証 |
| --- | --- | --- |
| T10-01 | G1 文面が summary-only 規約を満たす | 文面に実値要求がないこと |
| T10-02 | `read -s` シーケンスで履歴に残らない | `cat ~/.bash_history \| grep -c <pattern> == 0` |
| T10-03 | URL 取り違え防御が機能する | `PRODUCTION_API_URL=<staging-url>` で起動したとき exit 2 |
| T10-04 | binding diff 確認が staging/production 両方で取れる | 両 log 生成、diff が想定範囲 |
| T10-05 | runbook 10 章が網羅されている | 章見出し抽出で 10 章すべて存在 |

## ローカル/リモート実行コマンド

```bash
# ローカル（runbook 検証 / dry-run）
bash apps/api/scripts/runtime-smoke/run-smoke.sh --env production --dry-run --readonly

# リモート（CI からは起動しない）
# 本タスクでは production smoke を CI 自動経路に乗せない。runbook 手動経路のみ。
```

## 入出力 / 副作用

| 項目 | 値 |
| --- | --- |
| 入力 | Phase 8 staging rehearsal PASS / Phase 9 全 gate clean / G1 文面ドラフト |
| 出力 | `outputs/phase-10/wrangler-{staging,production}-bindings.log` / `binding-diff.log` / `production-runtime-smoke-attendance.md` runbook |
| 副作用 | wrangler dry-run のみ（real deploy なし）。production には到達しない |

## DoD（完了定義）

- [ ] G1 文面テンプレが確定し、summary-only 規約を満たす
- [ ] session 値取得・破棄シーケンスが確定（`HISTFILE` 抑止 / `read -s` / 環境変数経由 / `unset`）
- [ ] STAGING / PRODUCTION URL 取り違え防御 4 層が確定
- [ ] wrangler binding diff 確認手順と期待差分の解釈が確定
- [ ] production smoke runbook 10 章構成が確定
- [ ] 実行禁止経路（CI / hook / cron / `wrangler` 直接）が明記
- [ ] T10-01〜T10-05 検証観点が網羅

## 次 Phase の前提条件

Phase 11 着手の絶対条件:

1. G1 ユーザー明示承認取得済
2. Phase 8 staging リハーサル PASS
3. Phase 9 全 gate clean
4. wrangler binding diff が想定範囲内
5. 新規 terminal tab + HISTFILE 抑止 + `read -s` 環境準備済

これらが揃わない限り production への real smoke を起動しない。
