# Phase 11: 手動 smoke / 実測 evidence — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: GitHub Actions 上での OIDC token 取得・intermediate IdP 経由の短命 Cloudflare API token 発行・staging / production への deploy・24h 並行運用中の Cloudflare audit log 観測・旧長命 Token 失効までを実環境に対して実行する。CI 認証経路の変更に伴う副作用と evidence artifact 生成を伴うため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 11 / 13 |
| upstream issue | #405 |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| 想定実行者 | 人間オペレーター + Claude Code（user approval gate 併用） |

## 目的

Phase 5 ランブックを「人間 + AI が現場で読み返せる作業手順書」として再表現し、本タスクで取得すべき 13 evidence の取得手順・保存先・命名規則・redact ルール・取得不能時のフォールバックを 1 ファイルで完結させる。`outputs/phase-11/main.md` に実測サマリ（hash / size / 取得時刻 / PASS-FAIL）が漏れなく記録される状態を作り、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` または完全 PASS の状態語彙で Phase 12 / 13 へ引き渡す。

## 状態語彙

| 状態 | 定義 | 本 Phase での扱い |
| --- | --- | --- |
| `RUNTIME_PENDING` | spec 整備のみ・実測未取得 | Phase 11 開始前 |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | spec contract 完了 + 一部 runtime 実測未取得（24h 並行 / 失効 evidence 等の時間依存項目） | 本タスクで cutover 着手後・長命 token 失効前の中間状態。本 spec-created cycle 単独では使わず `RUNTIME_PENDING` に留める |
| `PASS` | 全 13 evidence 取得済 + 長命 token 失効確認済 | Phase 11 最終状態 |

## 事前準備チェックリスト

- [ ] `git branch --show-current` が `feat/u-fix-cf-acct-01-deriv-01-github-oidc` 系であること（仕様書 PR ブランチでは本 Phase 11 の実行を行わない）
- [ ] `mise exec -- node -v` が `v24.15.0` であること
- [ ] U-FIX-CF-ACCT-01 が Phase 11 verified に到達済（最小 4 scope 確定）
- [ ] intermediate IdP（一次候補 AWS STS）の trust policy が repo / branch / environment 単位で設定済
- [ ] GitHub Environments `staging` / `production` の required reviewers / wait timer が設定済
- [ ] 旧長命 `CLOUDFLARE_API_TOKEN` の Token ID / `created_on` / `last_used_on` を控える（rollback / 失効確認用）
- [ ] evidence ディレクトリ作成: `mkdir -p docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/evidence/{workflow-run,token-verify,lifetime,scope,audit-log,token-revoke,rollback-dry-run,fork-pr-leak,secret-hygiene}`

> 以下では `EVID=docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/evidence` と表記する。

## Approval Gate プロンプト（4 段）

本タスクは CI 認証経路変更のため、runtime approval gate を **(a) trust policy / IdP 構成 / (b) staging cutover / (c) production cutover / (d) 長命 Token revoke** の 4 段で構成する。commit / push / PR は Phase 13 の独立 user approval であり、G1〜G4 には含めない。Forms / D1 への直接副作用はないため Forms / D1 専用 gate は不要。

### G1: trust policy / IdP 構成

```
[G1: TRUST POLICY APPROVAL]
予定: AWS STS trust policy / broker 設定を構成し、GitHub OIDC subject / audience を repo・branch・environment 単位に限定する
影響: staging cutover の前提となる IdP 設定を作成する
失敗時 rollback: trust policy を削除し、長命 Token 経路を維持
"approve G1" と返信してください。
```

### G2: staging cutover

```
[G2: STAGING CUTOVER APPROVAL]
予定: `web-cd.yml` / `backend-ci.yml` の staging deploy job を OIDC 経路に切替
影響: ubm-hyogo-{api,web}-staging への deploy が OIDC 経路で実行される
旧 version ID（rollback 用）: api=<...> / web=<...>
失敗時 rollback:
  1. workflow YAML を 1 commit revert
  2. 旧長命 Token を 24h 一時再注入（runbook 5.2 節参照）
"approve G2" と返信してください。
```

### G3: production cutover

```
[G3: PRODUCTION CUTOVER APPROVAL]
前提: staging 経路で 7 日連続 green 確認済
予定: `web-cd.yml` / `backend-ci.yml` の production deploy job を OIDC 経路に切替
影響: ubm-hyogo-{api,web}-production への deploy が OIDC 経路で実行される
24h 並行期間中: 旧長命 Token と新 OIDC 経路の両方が "存在" するが deploy には OIDC のみ使用
監視: Cloudflare audit log で旧 Token の last_used_on が更新されないことを 24h 観測
"approve G3" と返信してください。
```

### G4: 長命 Token revoke

```
[G4: LONG-LIVED TOKEN REVOKE APPROVAL]
前提: production 24h 並行運用で旧 Token last_used_on 更新 0 件
予定:
  bash scripts/cf.sh api delete /accounts/<account_id>/tokens/<old_token_id>
  または Cloudflare Dashboard から revoke
影響: 旧長命 Token が完全失効。OIDC 経路が壊れた場合は緊急再発行が必要
失敗時 rollback: 新規長命 Token を最小 4 scope で発行し GitHub Secrets に再注入（24h 限定）
"approve G4" と返信してください。
```

### Independent approval: commit / push / PR

```
[COMMIT/PUSH/PR APPROVAL]
更新対象:
  .github/workflows/web-cd.yml / backend-ci.yml
  scripts/cf.sh
  docs/00-getting-started-manual/specs/15-infrastructure-runbook.md
  outputs/phase-11/main.md ほか evidence
git diff --stat:
  <提示>
"approve commit-push-pr" と返信してください。
```

## 13 evidence 一覧（保存先 / 命名規則 / 取得コマンド / 期待 size / 検証 grep）

| # | 種別 | 保存先 | 取得手段 | 期待 size | 検証 grep |
| --- | --- | --- | --- | --- | --- |
| 1 | GitHub Actions workflow run URL（staging OIDC 経路） | `$EVID/workflow-run/staging-run-url.txt` | `gh run list --workflow=web-cd.yml --limit 1 --json url,databaseId,conclusion > $EVID/workflow-run/staging-run-url.txt`（backend は別行追記） | <2 KB | `"conclusion":"success"` |
| 2 | GitHub Actions workflow run URL（production OIDC 経路） | `$EVID/workflow-run/production-run-url.txt` | `gh run list --workflow=backend-ci.yml --limit 1 --json url,databaseId,conclusion > $EVID/workflow-run/production-run-url.txt`（web は別行追記） | <2 KB | `"conclusion":"success"` |
| 3 | 短命 token verify 結果（redact 済） | `$EVID/token-verify/verify-staging.json` / `verify-production.json` | workflow 内で `curl https://api.cloudflare.com/client/v4/user/tokens/verify` を叩いた結果を artifact 化（token 値は `[REDACTED]` 置換） | <2 KB | `"status":"active"` |
| 4 | lifetime 検証ログ | `$EVID/lifetime/lifetime-check.log` | `expires_on - created_on` を計算した結果を tee | <1 KB | `lifetime_seconds <= 3600` |
| 5 | scope 検証ログ（最小 4 scope 一致） | `$EVID/scope/scope-check.log` | verify レスポンスから `policies[].permission_groups[]` を抽出 | <5 KB | `Workers Scripts:Edit` / `D1:Edit` / `Pages:Edit` / `Account Settings:Read` の 4 件のみ |
| 6 | 24h 並行運用中の Cloudflare audit log（旧 Token last_used_on 不更新） | `$EVID/audit-log/audit-24h-old-token.json` | `bash scripts/cf.sh api get '/accounts/<id>/audit_logs?since=<24h前>&token_id=<old_id>'` を 24h 経過時に取得 | 1-50 KB | `"action":{"type":"login"}` 行が 0 件 |
| 7 | 旧長命 Token 失効確認（Token list から消滅） | `$EVID/token-revoke/tokens-list-after-revoke.json` | `bash scripts/cf.sh api get /user/tokens` の出力で旧 Token ID が含まれないこと | 1-30 KB | `<old_token_id>` を含まない（`grep -c '<id>'` が 0） |
| 8 | rollback runbook の dry-run ログ | `$EVID/rollback-dry-run/rollback-dryrun.log` | runbook の各 step を `--dry-run` 系オプションで擬似実行した結果を tee | 1-20 KB | `[DRY-RUN]` プレフィクス + 各 step OK |
| 9 | fork PR 漏洩試験結果 | `$EVID/fork-pr-leak/fork-pr-test.log` | テスト用 fork から `pull_request` トリガで workflow を起動し、OIDC token 取得 step が `id-token: write` 不足で失敗することを確認 | <5 KB | `Error: Resource not accessible by integration` または同等の denial |
| 10 | secret hygiene check（log に token 値が残っていない） | `$EVID/secret-hygiene/grep-zero-match.log` | `grep -RE '(Bearer [A-Za-z0-9._-]+|cf_api_token=|CF_API_TOKEN=[A-Za-z0-9._-]+)' $EVID workflow logs` の結果 | <2 KB | 0 hit（`zero match` を明示出力） |
| 11 | OIDC subject claim ログ | `$EVID/audit-log/oidc-subject-claims.json` | GitHub OIDC sub/aud claims を redact 済み JSON として保存 | <5 KB | `repo:daishiman/UBM-Hyogo` |
| 12 | 7 日 staging green 証跡 | `$EVID/staging/staging-7day-green.jsonl` | staging run の 7 日分 success ledger | 1-20 KB | 7 行以上 |
| 13 | approval gate G1〜G4 取得記録 | `$EVID/../approval-gates.log` | 各 gate の `approve` 文字列受領時刻 / 承認者 / 実行コマンドを追記 | 1-5 KB | `G1` / `G2` / `G3` / `G4` の 4 行 |

## 実行手順（順序固定）

1. **事前準備チェックリスト** を 1 件ずつ満たす。
2. **G1 approval** → trust policy / IdP を構成し、subject claim の最小化を確認。
3. **G2 approval** → staging workflow を OIDC 経路に切替 → evidence #1 / #3(staging) / #4 / #5 / #11 を取得。
4. staging で 7 日連続 green を確認（毎日 1 回 deploy-dry-run か実 deploy をトリガ）→ evidence #12 を更新。green 期間中は状態語彙を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とし `outputs/phase-11/main.md` に進捗を追記。
5. **G3 approval** → production workflow を OIDC 経路に切替 → evidence #2 / #3(production) を取得。
5. 24h 並行運用 → evidence #6 を 24h 経過後に取得。旧 Token `last_used_on` が更新 0 件であることを確認。
6. **G4 approval** → 旧長命 Token を revoke → evidence #7 を取得。
7. **fork PR 漏洩試験** を実施 → evidence #9 を取得（このタイミングは G1 後ならいつでも可）。
8. **rollback dry-run** を実施 → evidence #8 を取得（G1 と G2 の間で実施推奨）。
9. **secret hygiene grep** を実施 → evidence #10 を取得。
10. approval gate log → evidence #13 を更新。
11. `outputs/phase-11/main.md` の実測表を全行更新し `hash`（`shasum -a 256`）/ `size`（`wc -c`）/ 取得時刻（`date -u +%FT%TZ`）/ PASS-FAIL を埋める。
12. `grep -RE '(Bearer [A-Za-z0-9._-]+|CLOUDFLARE_API_TOKEN=[A-Za-z0-9._-]+)' docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/` が 0 件であることを最終確認。

## redact パイプ（workflow log / curl 出力 共通）

```bash
sed -E \
  -e 's/(Authorization: Bearer )[A-Za-z0-9._-]+/\1[REDACTED]/g' \
  -e 's/(cf_api_token[=":[:space:]]+)[A-Za-z0-9._-]+/\1[REDACTED]/g' \
  -e 's/("value"[[:space:]]*:[[:space:]]*")[A-Za-z0-9._-]{20,}/\1[REDACTED]/g' \
  -e 's/(CLOUDFLARE_API_TOKEN=)[A-Za-z0-9._-]+/\1[REDACTED]/g'
```

短命 token 値は **artifact / log / commit のいずれにも残さない**。verify レスポンスを保存する際も `value` フィールドは redact 済を保存する。

## evidence サマリ表（`outputs/phase-11/main.md` の最終構成）

`outputs/phase-11/main.md` には次の 5 セクションを必ず置く:

1. status: `RUNTIME_PENDING → PASS_BOUNDARY_SYNCED_RUNTIME_PENDING → PASS` の遷移履歴
2. evidence 一覧表（13 行 × `path` / `hash` / `size_bytes` / `acquired_at_utc` / `result(PASS|FAIL|N/A)` / `notes`）
3. approval gate 取得記録表（G1〜G4 × `approved_at` / `approved_by` / `command_executed`）
4. lifetime / scope の数値検証結果（≤ 3600s / 4 scope のみ）
5. 後続タスクへの引き渡し（DERIV-02 / DERIV-03 / DERIV-04 への scope 境界記述）

## 取得不能時のフォールバック手順

| 事象 | 対応 | 記録先 |
| --- | --- | --- |
| OIDC token 取得失敗（intermediate IdP 側エラー） | rollback（旧長命 Token 24h 一時再注入）→ trust policy / IdP 設定見直しを `unassigned-task/` 起票 | `outputs/phase-11/main.md` notes |
| staging 7 日 green 中の deploy 失敗 | 該当 run の log を保存し `unassigned-task/` 起票 → 7 日カウントは fail 解消後リセット | 同上 |
| 24h 並行運用中に旧 Token last_used_on が更新された | 直ちに G3 を保留し原因調査（参照箇所 grep / workflow 履歴確認） | `outputs/phase-11/main.md` notes + 24h 期間延長記録 |
| 長命 Token revoke API 失敗 | Dashboard から手動 revoke、API エラーログを保存 | 同上 |
| fork PR 漏洩試験で OIDC token が漏洩した | 重大インシデント。直ちに `pull_request` trigger を削除しテスト用 fork は close | 同上 + security review unassigned-task |

## secret hygiene チェック（zero match 検査）

```bash
# token 値らしき長い base64/hex を検出
grep -RnE '(Bearer [A-Za-z0-9._-]{20,}|cf_api_token=[A-Za-z0-9._-]{20,}|CLOUDFLARE_API_TOKEN=[A-Za-z0-9._-]{20,})' \
  docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-11/ \
  || echo "[ZERO_MATCH] secret hygiene PASS"
```

`[ZERO_MATCH]` 行を `$EVID/secret-hygiene/grep-zero-match.log` に保存する。

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope 確定）/ UT-25-DERIV-04 PoC（intermediate IdP）
- 下流: U-FIX-CF-ACCT-01-DERIV-02 / DERIV-03 / DERIV-04 / 09c production deploy execution（OIDC 経路で deploy される前提が成立）

## 多角的チェック観点

- 最小 4 scope の継承が verify レスポンスで証明されている
- lifetime ≤ 3600s が数値で証明されている
- 旧 Token last_used_on 不更新が 24h スパンで証明されている
- secret hygiene zero match が log / artifact / commit で証明されている
- approval gate G1〜G4 がすべて取得済
- fork PR 漏洩試験が OIDC trust 境界の妥当性を証明している

## サブタスク管理

- [ ] 事前準備チェックリストを完了
- [ ] G1〜G4 approval gate を全件取得
- [ ] 13 evidence をすべて保存
- [ ] `outputs/phase-11/main.md` の 5 セクションを更新
- [ ] secret hygiene zero match 確認
- [ ] 状態語彙を最終的に `PASS` または `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に確定

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/` 配下 11 種別
- `outputs/phase-11/evidence/approval-gates.log`

## 完了条件

- [ ] 全 13 evidence が定義パスに存在し、`outputs/phase-11/main.md` の表が完全に埋まっている
- [ ] approval gate G1〜G4 の取得記録が残っている
- [ ] lifetime ≤ 3600s / scope = 最小 4 件 の数値検証 PASS
- [ ] 旧長命 Token 失効確認 PASS（または 24h 並行中で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` に確定）
- [ ] secret hygiene zero match PASS

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で commit / push / PR を実行していない（Phase 13 で扱う）
- [ ] CONST_007 違反（先送り）が発生していない
- [ ] 短命 token 値・長命 token 値が evidence / log / commit のいずれにも残っていない

## 次 Phase への引き渡し

Phase 12 へ:
- 13 evidence の hash / size / 結果サマリ
- 状態語彙の最終確定値
- 起票した unassigned-task のパス一覧
- aiworkflow-requirements 正本に反映すべき変更点（OIDC 経路の追記行）

## 実行タスク

- [ ] phase-11 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 参照資料

- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `CLAUDE.md`（Cloudflare CLI ラッパー / secret hygiene）
