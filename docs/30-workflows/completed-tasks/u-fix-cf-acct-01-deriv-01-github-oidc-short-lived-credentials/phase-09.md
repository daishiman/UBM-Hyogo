# Phase 9: 品質保証 — U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC → Cloudflare short-lived credential 移行

[実装区分: 実装仕様書]

判定根拠: 本 Phase は `scripts/cf.sh` / `.github/workflows/deploy-*.yml` / composite action の品質ゲートを定義する。実コマンドで shellcheck / actionlint / secret スキャン / Cloudflare audit log 突合 / typecheck / lint / unit test を検証する手順を含むため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 9 / 13 |
| wave | u-fix-cf-acct-01-deriv |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 で実装する `scripts/cf.sh` 改修・workflow YAML 編集・composite action 作成・aiworkflow-requirements 反映に対し、(a) typecheck / lint / unit test、(b) actionlint、(c) secret スキャン、(d) Cloudflare audit log 突合、(e) shellcheck、(f) bash 関数 unit test を、機械検証可能な品質ゲートとして確定する。

## 品質ゲートマトリクス

| # | ゲート名 | 検証コマンド | 期待結果 | blocker 種別 | Phase 13 evidence path |
| --- | --- | --- | --- | --- | --- |
| Q1 | typecheck（リポジトリ全体） | `mise exec -- pnpm typecheck` | exit 0 | hard | `outputs/phase-11/evidence/qa/typecheck.log` |
| Q2 | lint（リポジトリ全体） | `mise exec -- pnpm lint` | exit 0 | hard | `outputs/phase-11/evidence/qa/lint.log` |
| Q3 | shellcheck（`scripts/cf.sh`） | `shellcheck scripts/cf.sh` | exit 0、新規 warning 0 | hard | `outputs/phase-11/evidence/qa/shellcheck-cf.log` |
| Q4 | bash syntax check（`scripts/cf.sh`） | `bash -n scripts/cf.sh` | exit 0 | hard | `outputs/phase-11/evidence/qa/bash-n-cf.log` |
| Q5 | actionlint（`.github/workflows/`、`.github/actions/`） | `actionlint -color=never` をリポジトリルートで実行 | exit 0、composite action `cf-oidc-auth/action.yml` も対象 | hard | `outputs/phase-11/evidence/qa/actionlint.log` |
| Q6 | bash unit test（`resolve_cf_token` / `cmd_token verify`） | `bats tests/cf-sh/resolve-cf-token.bats`（または簡易 shell test） | exit 0 | hard | `outputs/phase-11/evidence/qa/bats-cf.log` |
| Q7 | secret スキャン（リポジトリ全体） | `gitleaks detect --source . --no-git --redact -v` または `trufflehog filesystem .` | findings 0 | hard | `outputs/phase-11/evidence/qa/gitleaks.log` |
| Q8 | branch protection 確認 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection \| jq '{required_pull_request_reviews,required_status_checks,lock_branch,enforce_admins}'` | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | hard | `outputs/phase-11/evidence/qa/branch-protection.json` |
| Q9 | legacy Token 残骸スキャン | `grep -RnE 'CLOUDFLARE_API_TOKEN' .github/workflows/ scripts/ docs/` | hit があるが、いずれも (a) `CF_AUTH_MODE` 経路の合法参照 / (b) コメント / (c) rollback runbook の説明、のみ | soft（評価判定が必要） | `outputs/phase-11/evidence/qa/legacy-token-grep.log` |
| Q10 | 旧長命 Token `last_used_on` 不更新（24h 並行期間中） | Phase 6 突合 3 で取得した `legacy-token-last-used-timeline.txt` を観測開始 / 24h 後の 2 行で diff | 2 行が同一値 | hard | `outputs/phase-11/evidence/parallel-run/legacy-token-last-used-timeline.txt` |
| Q11 | Cloudflare audit log で短命 token 発行が継続している（24h 期間中の `token.create` ≥ deploy 回数） | Phase 6 突合 1 の `cf-audit-token-create-24h.json` を job 数と照合 | `token.create` >= staging+production の deploy 数 | hard | `outputs/phase-11/evidence/parallel-run/cf-audit-token-create-24h.json` |
| Q12 | composite action 呼び出し検証（`uses: ./.github/actions/cf-oidc-auth` が deploy 系 workflow に存在） | `grep -RnE 'uses:\s*\./\.github/actions/cf-oidc-auth' .github/workflows/deploy-*.yml` | 各 deploy workflow に 1 hit 以上 | hard | `outputs/phase-11/evidence/qa/composite-action-usage.log` |
| Q13 | id-token job スコープ確認 | `grep -RnB 5 'id-token:\s*write' .github/workflows/ \| grep -E 'on:\|pull_request:'` | hit 0 | hard | `outputs/phase-11/evidence/qa/id-token-scope.log` |
| Q14 | evidence 完備 gate（Phase 7 Gate-A 再実行） | Phase 7 Gate-A スクリプト | exit 0 | hard | `outputs/phase-11/evidence/qa/evidence-presence.log` |
| Q15 | placeholder 不在 gate（Phase 7 Gate-B 再実行） | Phase 7 Gate-B スクリプト | exit 0 | hard | `outputs/phase-11/evidence/qa/placeholder.log` |
| Q16 | aiworkflow-requirements 反映確認 | `grep -qE 'CF_AUTH_MODE\|cf-oidc-auth\|OIDC' .claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 各 keyword 1 hit 以上 | hard | `outputs/phase-11/evidence/qa/aiworkflow-grep.log` |
| Q17 | rollback runbook 反映確認 | `grep -qE 'OIDC 失敗時\|24h\|長命 Token 一時再注入' docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 各 keyword 1 hit 以上 | hard | `outputs/phase-11/evidence/qa/runbook-grep.log` |

> hard: 失敗時に Phase 13 PR 作成を停止 / soft: 失敗時に `outputs/phase-11/main.md` で理由記録のうえ続行可

## 実行順序と blocking / non-blocking 区分

```
[order]                                      [blocking?]
Q1  typecheck                                blocking（hard）
Q2  lint                                     blocking（hard）
Q3  shellcheck                               blocking（hard）
Q4  bash -n                                  blocking（hard）
Q5  actionlint                               blocking（hard）
Q6  bats unit test                           blocking（hard）
Q7  secret scan (gitleaks)                   blocking（hard）
Q8  branch protection                        blocking（hard）
   --- Phase 11 実 deploy 実施後 ---
Q11 cf audit token.create                    blocking（hard）
Q10 last_used_on 不更新                      blocking（hard）
Q12 composite action usage                   blocking（hard）
Q13 id-token job scope                       blocking（hard）
Q9  legacy token grep（評価判定）            non-blocking（soft）
   --- ドキュメント反映確認 ---
Q16 aiworkflow-requirements                  blocking（hard）
Q17 rollback runbook                         blocking（hard）
   --- 最終ゲート ---
Q14 evidence presence                        blocking（hard）
Q15 placeholder 不在                         blocking（hard）
```

`Q1`〜`Q8` は Phase 13 evidence 取得の前段で実施可能。`Q9`〜`Q15` は実 deploy・24h 並行運用後に評価する。`Q16` / `Q17` は Phase 13 commit 直前に最終確認する。

## 失敗時の自動修復可否

| ゲート | 自動修復可否 | 失敗時の分岐 |
| --- | --- | --- |
| Q1 typecheck | × | 型エラーを最小差分で修正、CONST_007 で先送り禁止 |
| Q2 lint | ◯（`pnpm lint --fix` を 1 回試行） | 再失敗時は手修正 |
| Q3 shellcheck | × | 警告を 1 件ずつ解消。`# shellcheck disable=` の濫用を禁じる |
| Q4 bash -n | × | syntax error を即修正 |
| Q5 actionlint | × | YAML schema / expression の誤りを修正 |
| Q6 bats unit test | × | `resolve_cf_token` の挙動が legacy / oidc 両方で正しいか手動再現 |
| Q7 secret scan | × | findings は即時 revoke / rotate。コミット履歴に残っていないかも併せて確認（履歴に残っていれば `git filter-repo` 検討） |
| Q8 branch protection | × | drift があれば UT-GOV-001 / UT-GOV-003 の手順で手動修正 |
| Q9 legacy token grep | △ | 合法参照 / コメント / runbook 説明と確認できれば soft pass。それ以外なら A03 起票 |
| Q10 last_used_on 不更新 | × | 更新検出時は A09 → A03 に分岐し全 workflow 再走査 |
| Q11 cf audit token.create | × | 件数不足時は A02（verify 失敗）に分岐 |
| Q12 composite action usage | × | 呼び出し漏れを即追加 |
| Q13 id-token job scope | × | top-level / pull_request の付与を即削除 |
| Q14 / Q15 | × | 不足 evidence / placeholder を Phase 6 異常系に分岐し再取得 |
| Q16 / Q17 | ◯（手動編集） | aiworkflow-requirements / runbook を Phase 13 commit 前に追記 |

> 自動修復は基本不可。`Q2` の `--fix` のみが例外。

## evidence の整合性検証手順

Phase 13 evidence 取得後、以下の順で機械チェックを行う。

### Step A: ファイル数検証

```bash
EVIDENCE_DIR=docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/evidence
EXPECTED_MIN=13   # Phase 7 で列挙した 13 canonical evidence
ACTUAL=$(find "$EVIDENCE_DIR" -type f | wc -l)
test "$ACTUAL" -ge "$EXPECTED_MIN" \
  || { echo "EVIDENCE_COUNT_BELOW:$ACTUAL/$EXPECTED_MIN"; exit 1; }
```

### Step B: size > 0 検証（Phase 7 Gate-A 再実行）

Phase 7 Gate-A の `PATHS` 配列を再利用。

### Step C: hash 記録（後続 09c での再利用に備えた監査用）

```bash
( cd "$EVIDENCE_DIR" && find . -type f -print0 \
    | xargs -0 sha256sum ) > "$EVIDENCE_DIR/qa/hash.txt"
```

### Step D: mtime 確認（IdP 構成 → workflow 編集 → deploy → revoke の順序）

```bash
IDP_MTIME=$(stat -f '%m' "$EVIDENCE_DIR/idp/iam-role-create.json")
DEPLOY_MTIME=$(stat -f '%m' "$EVIDENCE_DIR/workflow/run-watch-deploy-api-staging.log")
REVOKE_MTIME=$(stat -f '%m' "$EVIDENCE_DIR/revoke/cf-token-revoke.json")

test "$IDP_MTIME" -le "$DEPLOY_MTIME" \
  || { echo "ORDER_VIOLATION: deploy before idp setup"; exit 1; }
test "$DEPLOY_MTIME" -le "$REVOKE_MTIME" \
  || { echo "ORDER_VIOLATION: revoke before deploy"; exit 1; }
```

### Step E: secret leak grep（Q7 と独立した evidence ディレクトリ走査）

```bash
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{20,}|cloudflare_api_token=[A-Za-z0-9._-]{20,}'
grep -REn "$LEAK_PATTERNS" "$EVIDENCE_DIR" \
  > "$EVIDENCE_DIR/qa/secret-leak.log" || true
test ! -s "$EVIDENCE_DIR/qa/secret-leak.log"
```

### Step F: placeholder grep（Q15 と同じ）

```bash
grep -rEn 'NOT_EXECUTED|<ACCOUNT_ID>|<LEGACY_TOKEN_ID>|TODO_EVIDENCE' "$EVIDENCE_DIR" \
  > "$EVIDENCE_DIR/qa/placeholder.log" || true
test ! -s "$EVIDENCE_DIR/qa/placeholder.log"
```

## bash unit test（Q6）の最小実装

`tests/cf-sh/resolve-cf-token.bats`（Phase 11 で実装、本 Phase は契約のみ）:

```bats
#!/usr/bin/env bats

setup() {
  source scripts/cf.sh.lib  # resolve_cf_token を内包する別ファイルに切り出した場合
}

@test "legacy mode: requires CLOUDFLARE_API_TOKEN" {
  CF_AUTH_MODE=legacy CLOUDFLARE_API_TOKEN= run resolve_cf_token
  [ "$status" -ne 0 ]
}

@test "legacy mode: passes when CLOUDFLARE_API_TOKEN is set" {
  CF_AUTH_MODE=legacy CLOUDFLARE_API_TOKEN=dummy run resolve_cf_token
  [ "$status" -eq 0 ]
}

@test "oidc mode: calls aws secretsmanager" {
  # mock aws CLI
  aws() { echo "mock-token"; }
  export -f aws
  CF_AUTH_MODE=oidc run resolve_cf_token
  [ "$status" -eq 0 ]
  [ "$CLOUDFLARE_API_TOKEN" = "mock-token" ]
}

@test "unknown mode fails fast" {
  CF_AUTH_MODE=invalid run resolve_cf_token
  [ "$status" -ne 0 ]
}
```

> `scripts/cf.sh` を `cf.sh` 本体（exec 起点）と `cf.sh.lib`（関数群）に分割するか、`bats` から `source` 可能な構造に再編する。Phase 11 で確定。

## bats が利用不能な環境向けの fallback

```bash
# scripts/cf.sh の resolve_cf_token を簡易 shell でテスト
( CF_AUTH_MODE=legacy CLOUDFLARE_API_TOKEN= bash -c '. scripts/cf.sh.lib; resolve_cf_token' ) \
  && { echo "FAIL: legacy without token should fail"; exit 1; } \
  || echo "ok 1: legacy without token fails"
( CF_AUTH_MODE=legacy CLOUDFLARE_API_TOKEN=dummy bash -c '. scripts/cf.sh.lib; resolve_cf_token' ) \
  && echo "ok 2: legacy with token passes" \
  || { echo "FAIL: legacy with token should pass"; exit 1; }
```

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-05.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-06.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-07.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-08.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `scripts/cf.sh`
- `CLAUDE.md`（branch protection / Cloudflare CLI ルール）

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 4 scope 検証）、UT-25-DERIV-04（OIDC 基盤共有）
- 下流: 09c production deploy execution（Q12 / Q16 で composite action / aiworkflow-requirements 反映済 evidence を引き渡す）

## evidence チェックリスト

Phase 11 完了時に以下が evidence ディレクトリ配下に揃っていること:

- [ ] `qa/typecheck.log`（Q1）
- [ ] `qa/lint.log`（Q2）
- [ ] `qa/shellcheck-cf.log`（Q3）
- [ ] `qa/bash-n-cf.log`（Q4）
- [ ] `qa/actionlint.log`（Q5）
- [ ] `qa/bats-cf.log`（Q6）
- [ ] `qa/gitleaks.log`（Q7）
- [ ] `qa/branch-protection.json`（Q8）
- [ ] `qa/legacy-token-grep.log`（Q9）
- [ ] `parallel-run/legacy-token-last-used-timeline.txt`（Q10）
- [ ] `parallel-run/cf-audit-token-create-24h.json`（Q11）
- [ ] `qa/composite-action-usage.log`（Q12）
- [ ] `qa/id-token-scope.log`（Q13）
- [ ] `qa/evidence-presence.log`（Q14）
- [ ] `qa/placeholder.log`（Q15）
- [ ] `qa/aiworkflow-grep.log`（Q16）
- [ ] `qa/runbook-grep.log`（Q17）
- [ ] `qa/hash.txt`（Step C）
- [ ] `qa/secret-leak.log`（Step E、空ファイルが PASS）

## 多角的チェック観点

- 不変条件継承: 最小 4 scope（Q11 の audit / AC6 の verify json で二重保証）
- secret 漏洩ゼロ（Q7 / Step E の 2 系統スキャン）
- production への副作用なし（Q11 audit log は read-only）
- placeholder と実測 evidence が物理パス分離（Q15 / Step F）
- coverage 概念は本タスクで適用外（実コード変更は `scripts/cf.sh` / workflow YAML が中心。bash unit test = Q6 でカバー）
- CONST_007: 失敗ゲートは Phase 6 / `unassigned-task/` 起票で必ず処理を完結させる

## サブタスク管理

- [ ] Q1〜Q17 を Phase 5 ランブックの step 番号と対応付ける
- [ ] Step A〜F の検証コマンドを Phase 5 ランブックの最終 step に組み込む
- [ ] bats unit test の最小契約（4 ケース）を Phase 11 実装に渡す
- [ ] 失敗時の分岐（Phase 6 異常系シナリオ A01〜A11 / `unassigned-task/` 起票）を確定
- [ ] `outputs/phase-09/main.md` を作成

## 成果物

- `outputs/phase-09/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。
- 品質ゲートマトリクス Q1〜Q17 が evidence path と blocker 種別とともに確定している
- blocking / non-blocking 区分と実行順序が定義されている
- 失敗時の自動修復可否と分岐先が確定している
- evidence 整合性検証 Step A〜F が機械実行可能なコマンドとして揃っている
- bash unit test（Q6）の最小契約が定義されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で実装、deploy、commit、push、PR を実行していない
- [ ] coverage 概念が誤用されていない（bash unit test = Q6 で代替明記）
- [ ] CONST_007 違反（「Phase XX で QA」型の先送り）が無い
- [ ] secret スキャンが gitleaks / trufflehog のいずれかで実行可能な形で定義されている

## 次 Phase への引き渡し

Phase 10 へ:

- 品質ゲートマトリクス Q1〜Q17
- evidence 整合性検証 Step A〜F のコマンド契約
- soft pass / hard fail の境界（Q9 のみ soft）
- 失敗時に Phase 6 異常系（A01〜A11）へ戻すか `unassigned-task/` 起票するかの判定基準
- bats unit test の 4 ケース最小契約

## 実行タスク

- [ ] phase-09 の既存セクションに記載した手順・検証・成果物作成を実行する。
