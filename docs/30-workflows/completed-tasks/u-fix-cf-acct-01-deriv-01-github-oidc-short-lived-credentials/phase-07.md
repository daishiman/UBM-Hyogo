# Phase 7: AC マトリクス — U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC → Cloudflare short-lived credential 移行

[実装区分: 実装仕様書]

判定根拠: 上流タスク仕様 (`docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`) の完了条件 6 項目を AC として展開し、Phase 5 ステップ / Phase 6 異常系 / evidence path との対応を機械検証可能な合否判定式で定義する。判定式は exit code / 文字列 grep / jq 評価 / file 存在 / hash 一致のいずれかに帰着し、Phase 11 実測時に自動評価できる粒度に落とすため、docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 7 / 13 |
| wave | u-fix-cf-acct-01-deriv |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

上流タスクの 6 完了条件を 1 行 1 AC のマトリクスに展開し、(a) 検証 Phase、(b) evidence path、(c) 機械検証可能な合否判定式、(d) 失敗時 follow-up（Phase 6 異常系シナリオ A01〜A11 と 1:1 対応）を一意に定める。さらに 「未実装/未実測を PASS と扱わない」 2 段ゲート（Gate-A: evidence presence / Gate-B: placeholder 不在）を全 AC に適用する。

## 共通変数

```bash
EVID=docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/evidence
```

## AC マトリクス

| AC ID | 内容（上流完了条件由来） | 検証 Phase | evidence path | 合否判定式（機械検証） | 失敗時 follow-up |
| --- | --- | --- | --- | --- | --- |
| AC1 | deploy workflow が長命 `secrets.CLOUDFLARE_API_TOKEN` を参照しない | Phase 5 Step 0 / Step 3-3 / Phase 6 全 workflow 走査 | `$EVID/workflow/legacy-token-references-final.log` | `test -f "$EVID/workflow/legacy-token-references-final.log" && ! test -s "$EVID/workflow/legacy-token-references-final.log"`（hit 0） | A03 → `task-deriv-01-orphan-workflow-XXX-001` 起票し移植 |
| AC2 | short-lived credential の lifetime が 1 時間以内 | Phase 5 Step 4-1 / Phase 6 audit 突合 1 | `$EVID/verify-token/cf-token-verify-staging.json`、`$EVID/verify-token/cf-token-verify-production.json`、`$EVID/parallel-run/cf-audit-token-create-24h.json` | `for f in "$EVID/verify-token"/cf-token-verify-*.json; do jq -e '(.result.expires_on \| fromdateiso8601) - (.result.not_before \| fromdateiso8601) <= 3600' "$f" \|\| exit 1; done` および `jq -e '[.[] \| ((.when_expires \| fromdateiso8601) - (.when \| fromdateiso8601))] \| max <= 3600' "$EVID/parallel-run/cf-audit-token-create-24h.json"` | A04 → IAM Role MaxSessionDuration を 3600 にキャップ |
| AC3 | staging / production それぞれで OIDC 経路が独立に成立する | Phase 5 Step 4・Step 7 / Phase 6 audit 突合 2 | `$EVID/workflow/run-watch-deploy-api-staging.log`、`$EVID/workflow/run-watch-deploy-api-production.log`、`$EVID/idp/cloudtrail-assume-role-24h.json` | `grep -E '"conclusion":\s*"success"' "$EVID/workflow/run-watch-deploy-api-staging.log" && grep -E '"conclusion":\s*"success"' "$EVID/workflow/run-watch-deploy-api-production.log" && jq -e 'length >= 2 and ([.[] \| .Result \| fromjson \| .responseElements] \| map(select(. != null)) \| length) >= 2' "$EVID/idp/cloudtrail-assume-role-24h.json"`（staging / production の 2 系統で AssumeRoleWithWebIdentity 成功記録） | A02 / A10 → trust policy / Secrets Manager 値の再構成 |
| AC4 | 旧長命 Token が失効済み（Cloudflare Dashboard で確認） | Phase 5 Step 8 / Phase 6 突合 3 | `$EVID/revoke/cf-token-revoke.json`、`$EVID/revoke/gh-secrets-staging-after.txt`、`$EVID/revoke/gh-secrets-production-after.txt`、`$EVID/parallel-run/legacy-token-last-used-timeline.txt` | `jq -e '.result.status == "disabled" or .success == true' "$EVID/revoke/cf-token-revoke.json" && ! grep -q '^CLOUDFLARE_API_TOKEN' "$EVID/revoke/gh-secrets-staging-after.txt" && ! grep -q '^CLOUDFLARE_API_TOKEN' "$EVID/revoke/gh-secrets-production-after.txt"` | A06 → 失効順序違反時は revoke 完了まで GitHub Secrets を再注入し再失効 |
| AC5 | 緊急 rollback 手順が runbook 化されている | Phase 5 Step 9 | `$EVID/runbook/runbook-update.diff`、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | `test -s "$EVID/runbook/runbook-update.diff" && grep -qE '24h\|24 ?時間\|rollback\|長命 Token 一時再注入' "$EVID/runbook/runbook-update.diff" && grep -qE 'OIDC 失敗時' docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | A07 → 期限管理の自動化を `task-deriv-01-rollback-overrun-XXX-001` で起票 |
| AC6 | short-lived credential の scope が最小 4 scope に限定されている | Phase 5 Step 4-1 / verify token | `$EVID/verify-token/cf-token-verify-staging.json`、`$EVID/verify-token/cf-token-verify-production.json` | `for f in "$EVID/verify-token"/cf-token-verify-*.json; do jq -e '.result.policies \| map(.permission_groups[].name) \| flatten \| unique \| sort == ["Account Settings:Read","Cloudflare Pages:Edit","D1:Edit","Workers Scripts:Edit"]' "$f" \|\| exit 1; done` | A02 → IAM Role の Secrets Manager 参照先を最小 scope の token に固定し直す |

> 注: AC6 の `permission_groups[].name` 抽出パスは Cloudflare API の実レスポンス形状に依存する。Phase 11 実測時に jq path を実 JSON で確認し、相違あれば本マトリクスを更新する。

## evidence × AC クロスリファレンス

Phase 11 の canonical evidence は 13 件に正規化する。旧ドラフトの 13 canonical evidence は detailed sub-artifact とし、合否判定の正本ではない。

| evidence # | 物理パス | 満たす AC |
| --- | --- | --- |
| #1 | `$EVID/workflow/legacy-token-references-before.log` | AC1（before/after 比較の baseline） |
| #2 | `$EVID/workflow/legacy-token-references-final.log` | AC1 |
| #3 | `$EVID/workflow/pr-target-scan.log` | AC1 補強（A01 隔離） |
| #4 | `$EVID/idp/iam-role-create.json` | AC3 |
| #5 | `$EVID/idp/iam-role-trust-policy-audit.json` | AC3 / A10 |
| #6 | `$EVID/idp/cloudtrail-assume-role-24h.json` | AC3 |
| #7 | `$EVID/idp/secretsmanager-create.json`（または既存 secret の ARN 確認 log） | AC6 |
| #8 | `$EVID/cf-script/cf.sh.diff` | AC1（CF_AUTH_MODE 切替実装） |
| #9 | `$EVID/workflow/run-watch-deploy-api-staging.log` | AC3 |
| #10 | `$EVID/workflow/run-watch-deploy-api-production.log` | AC3 |
| #11 | `$EVID/verify-token/cf-token-verify-staging.json` | AC2 / AC6 |
| #12 | `$EVID/verify-token/cf-token-verify-production.json` | AC2 / AC6 |
| #13 | `$EVID/parallel-run/cf-audit-token-create-24h.json` | AC2 |
| #14 | `$EVID/parallel-run/legacy-token-last-used-timeline.txt` | AC4 |
| #15 | `$EVID/parallel-run/staging-7day-green.jsonl` | AC3（staging 7d green 観測） |
| #16 | `$EVID/revoke/cf-token-revoke.json` | AC4 |
| #17 | `$EVID/revoke/gh-secrets-staging-after.txt` | AC4 |
| #18 | `$EVID/revoke/gh-secrets-production-after.txt` | AC4 |
| #19 | `$EVID/revoke/revoke-order-check.log` | detailed sub-artifact of #10 |
| #20 | `$EVID/runbook/runbook-update.diff` | detailed sub-artifact of Phase 12 system-spec summary |
| #21 | `$EVID/runbook/deployment-gha.md.before` | detailed sub-artifact of Phase 12 system-spec summary |
| #22 | `$EVID/runbook/deployment-secrets-management.md.before` | detailed sub-artifact of Phase 12 system-spec summary |
| #23 | `$EVID/pen-test/fork-pr-id-token-attempt.log` | canonical evidence #12 |

逆引き（AC → evidence）:

- AC1: #1 / #2 / #3 / #8 / #23
- AC2: #11 / #12 / #13
- AC3: #4 / #5 / #6 / #9 / #10 / #15 / #23
- AC4: #14 / #16 / #17 / #18 / #19
- AC5: #20 / #21 / #22
- AC6: #7 / #11 / #12

## 「未実装/未実測を PASS と扱わない」 2 段ゲート

### Gate-A: evidence presence（file size > 0）

```bash
PATHS=(
  "$EVID/workflow/legacy-token-references-final.log"
  "$EVID/workflow/pr-target-scan.log"
  "$EVID/idp/iam-role-create.json"
  "$EVID/idp/iam-role-trust-policy-audit.json"
  "$EVID/idp/cloudtrail-assume-role-24h.json"
  "$EVID/cf-script/cf.sh.diff"
  "$EVID/workflow/run-watch-deploy-api-staging.log"
  "$EVID/workflow/run-watch-deploy-api-production.log"
  "$EVID/verify-token/cf-token-verify-staging.json"
  "$EVID/verify-token/cf-token-verify-production.json"
  "$EVID/parallel-run/cf-audit-token-create-24h.json"
  "$EVID/parallel-run/legacy-token-last-used-timeline.txt"
  "$EVID/parallel-run/staging-7day-green.jsonl"
  "$EVID/revoke/cf-token-revoke.json"
  "$EVID/revoke/gh-secrets-staging-after.txt"
  "$EVID/revoke/gh-secrets-production-after.txt"
  "$EVID/revoke/revoke-order-check.log"
  "$EVID/runbook/runbook-update.diff"
  "$EVID/pen-test/fork-pr-id-token-attempt.log"
)
fail=0
for p in "${PATHS[@]}"; do
  test -e "$p" || { echo "MISSING: $p"; fail=1; continue; }
  # legacy-token-references-final.log は size 0 が成功条件（hit 0）
  case "$p" in
    *legacy-token-references-final.log) : ;;
    *) test -s "$p" || { echo "EMPTY: $p"; fail=1; } ;;
  esac
done
exit $fail
```

期待: exit 0。
特記: `legacy-token-references-final.log` のみ「ファイル存在 + 中身 0」が PASS（grep 結果が空）。

### Gate-B: placeholder 不在

```bash
PLACEHOLDER='NOT_EXECUTED|TODO_EVIDENCE|PLACEHOLDER|<ACCOUNT_ID>|<LEGACY_TOKEN_ID>'
grep -REn "$PLACEHOLDER" "$EVID" \
  && { echo "PLACEHOLDER REMAINS"; exit 1; } \
  || echo "Gate-B PASS"
```

期待: hit 0。Phase 11 で実値に置換されていること（`<ACCOUNT_ID>` / `<LEGACY_TOKEN_ID>` の placeholder が evidence に残っていれば未実測扱い）。

両ゲートが通過しない限り、AC1〜AC6 の合否判定式は評価しない（fail-fast）。

## 機械検証スクリプト統合（Phase 11 完了判定）

```bash
# 1. Gate-A
bash -c "<上記 Gate-A>"
# 2. Gate-B
bash -c "<上記 Gate-B>"
# 3. AC1〜AC6 の判定式を順に実行（上表「合否判定式」列のコマンドを 1 行ずつ評価）
# 4. secret leak ゲート（Phase 6 A05）
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{20,}|cloudflare_api_token=[A-Za-z0-9._-]{20,}'
! grep -REn "$LEAK_PATTERNS" "$EVID"
# 5. 全 workflow 走査ゲート（Phase 6 A03）
! grep -RnE 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/
# 6. fork-PR id-token 隔離（Phase 6 A01）
! grep -RnB 5 'id-token:\s*write' .github/workflows/ | grep -E 'on:|pull_request:'
```

すべて exit 0 で Phase 11 完了 → Phase 12 サマリ作成 → Phase 13 PR。

## 失敗時 follow-up クロスリファレンス

| AC | 失敗パターン | Phase 6 シナリオ | 起票先 |
| --- | --- | --- | --- |
| AC1 | legacy 参照残存 | A03 | `task-deriv-01-orphan-workflow-XXX-001` |
| AC1 補強 | fork PR id-token 漏洩 | A01 | `task-deriv-01-fork-pr-isolation-fail-001` |
| AC2 | lifetime 超過 | A04 | `task-deriv-01-cf-token-lifetime-cap-001`（Cloudflare 側 cap 不可時のみ） |
| AC3 | staging/production 片系統失敗 | A02 / A08 | `task-deriv-01-token-verify-fail-001` または `task-deriv-01-cf-outage-playbook-001` |
| AC3 監査 | trust policy drift | A10 | `task-deriv-01-trust-policy-drift-monitor-001` |
| AC4 | revoke / Secrets 削除順序違反 | A06 | `task-deriv-01-revoke-orchestrator-001` |
| AC4 | last_used_on 更新検出 | A09 → A03 | `task-deriv-01-orphan-workflow-XXX-001` |
| AC5 | rollback overrun | A07 | `task-deriv-01-rollback-overrun-XXX-001` |
| AC6 | scope 過剰 | A02 | `task-deriv-01-token-verify-fail-001` |
| 全般 | evidence 不足 | A11 | `task-deriv-01-evidence-gap-001` |
| 全般 | secret leak | A05 | `task-deriv-01-secret-leak-source-001` |

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/index.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-05.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-06.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 4 scope の確定）
- 下流: U-FIX-CF-ACCT-01-DERIV-03（rotation 概念の trust policy 更新化）

## 多角的チェック観点

- AC 6 件すべてが機械検証可能な合否判定式（exit code / grep / jq / file 存在）に帰着している
- Gate-A（presence）と Gate-B（placeholder 不在）が全 AC の前提として適用されている
- 13 canonical evidence と AC のクロスリファレンスが両方向（AC→evidence / evidence→AC）で取れる。23 detailed sub-artifact は補助扱い。
- 失敗時 follow-up が Phase 6 シナリオ A01〜A11 と 1:1 対応している（CONST_007）
- AC2 / AC6 で短命要件と最小 scope 継承が二重に保証されている

## サブタスク管理

- [ ] AC1〜AC6 の合否判定式を機械検証可能な形に確定
- [ ] 13 canonical evidence × AC クロスリファレンスを両方向で記述
- [ ] Gate-A / Gate-B の検証スクリプトを記載
- [ ] 失敗時 follow-up を Phase 6 シナリオと結線
- [ ] AC6 の jq path を Phase 11 実測時に確認する旨の注記を残す
- [ ] `outputs/phase-07/main.md` を作成

## 成果物

- `outputs/phase-07/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。
- 上流 6 完了条件すべてが 1 行 1 AC のマトリクスとして展開されている
- 各 AC に検証 Phase / evidence path / 合否判定式 / 失敗時 follow-up が揃っている
- Gate-A / Gate-B の 2 段ゲートが全 AC に適用される構造になっている
- 13 canonical evidence と AC のクロスリファレンス表が両方向で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 「未実装/未実測を PASS と扱わない」 2 段ゲートが機械検証可能な形で記述されている
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない

## 次 Phase への引き渡し

Phase 8（DRY 化）以降に渡す:

- AC1〜AC6 の合否判定式（Phase 11 実測時に bash スクリプト化する元）
- Gate-A / Gate-B の 2 段ゲート（Phase 9 品質保証で CI 化を検討する元）
- 13 canonical evidence × AC クロスリファレンス（Phase 10 最終レビュー時の漏れチェック表）
- 失敗時 follow-up 13 件（Phase 12 ドキュメント更新で `unassigned-task/` に転記する元）

## 実行タスク

- [ ] phase-07 の既存セクションに記載した手順・検証・成果物作成を実行する。
