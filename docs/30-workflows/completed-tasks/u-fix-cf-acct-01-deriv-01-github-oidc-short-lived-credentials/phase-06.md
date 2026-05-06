# Phase 6: 異常系検証 — U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC → Cloudflare short-lived credential 移行

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 5 ランブックの各 Step で発生し得る異常事象（trust policy 緩和 / fork PR 漏洩 / 漏れ workflow / lifetime 超過 / secret leak / 失効順序違反 / rollback overrun 等）を、(a) 検出方法 (b) evidence 保存先 (c) escalation path (d) `unassigned-task/` 起票テンプレで定義する。検出操作のうち pen test / Cloudflare audit 突合 / GitHub Actions 実 run 観測は実環境への副作用が伴うため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 6 / 13 |
| wave | u-fix-cf-acct-01-deriv |
| mode | sequential |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 3 リスクマトリクスと Phase 5 ランブックの各 Step 失敗を網羅する 10 件以上の異常系シナリオ（A01〜A10）を定義し、(a) 検出方法 (b) evidence 保存先 (c) escalation path (d) `unassigned-task/` 起票テンプレ を一意に紐付ける。CONST_007 に従い「Phase XX で対応」と先送りせず、本 Phase もしくは `unassigned-task/` 起票で必ず処理境界を確定する。

## 異常系シナリオマトリクス

### A01 — fork PR / `pull_request_target` 経由の OIDC token 漏洩試行

| 項目 | 内容 |
| --- | --- |
| 検出方法 | fork PR を対象に pen test workflow を実行し、id-token が発行されるか確認 |
| pen test 手順 | 1. fork repo を作成（または既存 fork に switch） 2. fork から `dev` への PR を起票 3. PR 上で `permissions: id-token: write` の付与可否を `gh api repos/<fork>/actions/runs/<id>/logs` で確認 4. 期待: deploy job がそもそも fork PR では起動しない（`push` event のみ）または id-token: write が job スコープで存在しない |
| evidence 保存先 | `evidence/pen-test/fork-pr-id-token-attempt.log` |
| 期待結果 | id-token 発行が試行レベルで失敗。AssumeRoleWithWebIdentity も失敗（trust policy の `sub` claim ミスマッチで AccessDenied） |
| escalation | 万一 fork PR から AssumeRoleWithWebIdentity が成功した場合、即時 IAM Role を一時停止し trust policy を再構成 |
| unassigned-task 起票 | `task-deriv-01-fork-pr-isolation-fail-001` / scope: trust policy の `sub` claim 再設計 / blocker: 本 Phase 全体 |

### A02 — OIDC token 検証失敗（`/user/tokens/verify` が `success: false`）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 4-1 の verify step で `.success != true` |
| evidence 保存先 | `evidence/verify-token/cf-token-verify-{staging,production}.json` |
| escalation | (a) Secrets Manager の値が古い → 1Password から再 pull (b) scope 不足 → IAM Role の Secrets Manager 参照先を再確認 (c) revoke 済 token を引いている → 1Password の current 値を再投入 |
| unassigned-task 起票 | 構造的不整合（IdP ↔ Cloudflare 連携設計の見直し）が必要なら `task-deriv-01-token-verify-fail-001` |

### A03 — 漏れ workflow（legacy `secrets.CLOUDFLARE_API_TOKEN` 残存）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | 全 workflow に対する grep を Phase 11 完了前と長命 Token 失効前の 2 回実行 |
| 検証コマンド | 下記「全 workflow 走査ゲート」参照 |
| evidence 保存先 | `evidence/workflow/legacy-token-references-final.log`（hit 0 を期待） |
| escalation | hit 1 件以上なら 当該 workflow を OIDC 経路に移植してから Step 8 の token 失効に進む。CONST_007 に従い「あとで対応」を許容しない |
| unassigned-task 起票 | 移植が大規模で本タスク Phase 内に収まらない場合のみ `task-deriv-01-orphan-workflow-XXX-001` |

### A04 — short-lived token の lifetime 超過

| 項目 | 内容 |
| --- | --- |
| 検出方法 | `expires_on - not_before > 3600` を verify-token JSON で計算 |
| evidence 保存先 | `evidence/verify-token/cf-token-verify-{staging,production}.json` |
| escalation | (a) IAM Role `MaxSessionDuration` を 3600 秒以下にキャップ (b) Cloudflare 側で発行する API Token の `expires_on` を 1h 以内に固定 (c) retry / long-running job では再 verify step を挟み、超過前に再取得 |
| unassigned-task 起票 | Cloudflare 側 API が 1h cap をサポートしない事実が判明したら `task-deriv-01-cf-token-lifetime-cap-001` |

### A05 — secret leak（log / artifact / evidence）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | evidence ディレクトリ全体および GitHub Actions log を以下パターンで grep |
| 検証コマンド | `grep -REn 'Bearer [A-Za-z0-9._-]+\|sk-[A-Za-z0-9]+\|aws_secret_access_key\|cloudflare_api_token=[A-Za-z0-9._-]+\|Authorization:\s*Bearer\s+[A-Za-z0-9]' "$EVID"` で hit 0 |
| evidence 保存先 | leak 検出時は該当 evidence を即削除し、redact pipeline 修正後に再取得（leak の二次拡散防止） |
| escalation | leak が確認された場合、当該 token を Cloudflare Dashboard / AWS で即時 revoke / rotate。impact 範囲を `outputs/phase-11/main.md` に記録 |
| unassigned-task 起票 | leak 経路（log 出力箇所）の修正が apps コード or workflow 変更を伴う場合 `task-deriv-01-secret-leak-source-001` |

### A06 — 失効順序違反（GitHub Secrets 先行削除）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 8 のコマンド履歴で `gh secret remove` が Cloudflare `revoke` より先に実行されたか確認 |
| 検証コマンド | `history \| grep -nE 'gh secret remove\|/user/tokens/<id> -X DELETE' \| sort -k1` で順序確認 |
| evidence 保存先 | `evidence/revoke/revoke-order-check.log` |
| escalation | 順序違反時は revoke 完了まで GitHub Secrets を再注入し、rollback 経路を確保した上で再失効 |
| unassigned-task 起票 | 順序を守る自動化スクリプトが必要なら `task-deriv-01-revoke-orchestrator-001` |

### A07 — rollback overrun（24h 期限超過）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Step 9 で長命 Token 一時再注入後、24h 経過しても revoke が実施されていない |
| evidence 保存先 | `outputs/phase-11/main.md` に再注入時刻と revert 期限を記録、超過判定を `evidence/runbook/rollback-overrun-check.log` に保存 |
| escalation | 期限超過時は CONST_007 違反として `unassigned-task/` に即起票 |
| unassigned-task 起票 | `task-deriv-01-rollback-overrun-XXX-001` / scope: 期限管理の自動化（Cloudflare scheduled revoke / GitHub Actions cron） |

### A08 — Cloudflare 障害時のフェイルオーバー

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Cloudflare API が 5xx / timeout 連発（`/user/tokens/verify` / deploy API） |
| 発動条件 | 30 分以内に 3 回連続失敗、または Cloudflare status page で incident 公示 |
| evidence 保存先 | `evidence/parallel-run/cf-incident-window.log` |
| escalation | (a) deploy 自体を一時停止し復旧待ち (b) 既存 production version を `cf.sh rollback` で安定 version に固定 (c) OIDC 経路の問題切分のために legacy 経路で 1 回だけ verify 実施し問題ドメインを切分 |
| unassigned-task 起票 | 障害が Cloudflare 側設計起因と判明したら `task-deriv-01-cf-outage-playbook-001` |

### A09 — `last_used_on` 更新検出（OIDC 経路採用後にも legacy が呼ばれている）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 5 Step 7 の 24h 観測で `last_used_on` が観測開始時刻より後に更新 |
| evidence 保存先 | `evidence/parallel-run/legacy-token-last-used.json` を観測開始 / 24h 後の 2 回取得し diff |
| escalation | A03（漏れ workflow）に分岐し全 workflow を再走査。修正完了後に 24h 観測をリセットして再開 |
| unassigned-task 起票 | A03 と同テンプレ |

### A10 — IAM Role 信頼関係不一致（trust policy が緩い / `sub` claim 不適切）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | trust policy を意図的に緩めた場合に AssumeRoleWithWebIdentity が成功してしまうかを periodic audit |
| 検証コマンド | `aws iam get-role --role-name github-actions-cloudflare-deploy --query 'Role.AssumeRolePolicyDocument'` の sub claim list が staging / production 限定であることを評価 |
| evidence 保存先 | `evidence/idp/iam-role-trust-policy-audit.json` |
| audit 周期 | 30 日に 1 回（U-FIX-CF-ACCT-01-DERIV-03 rotation runbook と統合） |
| escalation | 緩んでいる場合は即時 trust policy を引き締め、過去 30 日の `cloudtrail` 記録を確認 |
| unassigned-task 起票 | 監査自動化が必要なら `task-deriv-01-trust-policy-drift-monitor-001` |

### A11 — evidence 不足（Phase 11 完了時の取得漏れ）

| 項目 | 内容 |
| --- | --- |
| 検出方法 | Phase 7 AC ゲートの evidence presence チェックでヒット |
| evidence 保存先 | 該当 evidence path（空ファイルまたは placeholder） |
| escalation | 該当 Step を再実行。A02 / A08 由来の許容理由がある場合のみ理由 evidence で AC 通過 |
| unassigned-task 起票 | 構造的に取得不能なら `task-deriv-01-evidence-gap-001` |

## 全 workflow 走査ゲート（A03 検証コマンド）

長命 Token 失効前と Phase 11 完了前の 2 回実行する。

```bash
# 1. legacy 参照の全 workflow 走査
LEGACY_PATTERN='secrets\.CLOUDFLARE_API_TOKEN|env\.CLOUDFLARE_API_TOKEN.*secrets\.'
grep -RnE "$LEGACY_PATTERN" .github/workflows/ \
  > "$EVID/workflow/legacy-token-references-final.log" || true
test ! -s "$EVID/workflow/legacy-token-references-final.log" \
  || { echo "ORPHAN WORKFLOW DETECTED"; exit 1; }

# 2. id-token: write の job スコープ確認（top-level / pull_request 経由を排除）
grep -RnB 5 'id-token:\s*write' .github/workflows/ \
  | grep -E 'on:|pull_request:' \
  && { echo "id-token at top-level or pull_request scope DETECTED"; exit 1; } \
  || echo "id-token job scope OK"

# 3. pull_request_target 不採用確認
! grep -RnE 'pull_request_target' .github/workflows/ \
  || { echo "pull_request_target DETECTED"; exit 1; }
```

期待: 全 exit 0。
失敗時: 該当箇所を修正して再 push し、Phase 11 完了判定をリセット。

## audit ログ突合手順

OIDC 化が「実際に主経路として動いている」ことを以下 3 系統の audit 突合で確認する。

### 突合 1: Cloudflare 側 `created_on` / `expires_on`

```bash
# 短命 token の発行履歴（過去 24h）
curl -s -H "Authorization: Bearer $(op read 'op://Cloudflare/CF_AUDIT_TOKEN/credential')" \
  "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/audit_logs?since=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)&action.type=token.create" \
  | jq '[.result[] | {id: .id, when: .when, action: .action.type, actor_email: .actor.email}]' \
  | tee "$EVID/parallel-run/cf-audit-token-create-24h.json"
```

期待: 24h で N 件以上の token.create が記録され、各 token の lifetime が 1h 以内。
失敗時: A04（lifetime 超過）または A02（verify 失敗）に分岐。

### 突合 2: GitHub Actions OIDC 発行ログ（Actions log）

```bash
# 過去 24h の deploy run 一覧
gh run list --workflow backend-ci.yml --branch main --limit 50 \
  --json databaseId,createdAt,conclusion \
  > "$EVID/workflow/gh-runs-24h.json"

# 各 run の AssumeRoleWithWebIdentity 結果が success かを CloudTrail 側で突合
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRoleWithWebIdentity \
  --start-time $(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ) \
  --query 'Events[].{Time:EventTime,User:Username,Role:Resources[0].ResourceName,Result:CloudTrailEvent}' \
  | tee "$EVID/idp/cloudtrail-assume-role-24h.json"
```

期待: GitHub Actions の deploy run 件数 = CloudTrail の AssumeRoleWithWebIdentity 成功件数（fork PR / 不正ブランチからの試行は AccessDenied として記録）。
失敗時: 件数不一致 → A01 / A10 のいずれかに分岐。

### 突合 3: 旧長命 Token の `last_used_on` 不更新

```bash
# 観測開始時刻と 24h 後の 2 回取得して diff
curl -s -H "Authorization: Bearer $(op read 'op://Cloudflare/CF_AUDIT_TOKEN/credential')" \
  "https://api.cloudflare.com/client/v4/user/tokens/<LEGACY_TOKEN_ID>" \
  | jq '.result.last_used_on' \
  | tee -a "$EVID/parallel-run/legacy-token-last-used-timeline.txt"
```

期待: 2 回の値が同一（不更新）。
失敗時: A09 / A03 に分岐。

## secret leak 検出ゲート（A05 の機械検証手順）

```bash
LEAK_PATTERNS='Bearer [A-Za-z0-9._-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{20,}|cloudflare_api_token=[A-Za-z0-9._-]{20,}'
grep -REn "$LEAK_PATTERNS" "$EVID" \
  && { echo "LEAK DETECTED"; exit 1; } \
  || echo "secret leak gate: PASS"
```

このゲートは Phase 11 完了直前および G4（長命 Token 失効）直前の 2 回実行する。

## 検出ヌケ防止のクロスチェック

| 苦戦箇所（index.md / 上流タスク） | 紐付き異常系 |
| --- | --- |
| 1. Cloudflare の OIDC 直接受入れ非対応 | A02 / A08 |
| 2. 「short-lived」の lifetime 設計 | A04 |
| 3. fork PR / `pull_request_target` 漏洩防止 | A01 |
| 4. rollback 経路の確保 | A07 |
| 5. 最小 4 scope の継承 | A02 / A10 |

追加: A03（漏れ workflow）/ A05（secret leak）/ A06（失効順序違反）/ A09（last_used_on 更新検出）/ A11（evidence 不足）。合計 11 シナリオ。

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-05.md`（Step 別失敗分岐）
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `scripts/cf.sh`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01（最小 scope）、UT-25-DERIV-04（OIDC 基盤共有）
- 下流: U-FIX-CF-ACCT-01-DERIV-03（rotation runbook が trust policy 更新概念に置換され、A10 監査と統合される）

## 多角的チェック観点

- 上流タスクの苦戦箇所 5 項目すべてに対応シナリオが紐付いている
- fork PR / `pull_request_target` 経路の漏洩防止が pen test として実行可能（A01）
- short-lived 要件が A04 / Cloudflare audit / IAM Role の三重制約で保証されている
- secret leak が 2 回ゲート（Phase 11 完了直前 / G4 直前）で検証される
- 起票テンプレが title / scope / blocker / refs の 4 項目で揃っている
- CONST_007: 「先送り」表現を排除（必ず本 Phase 内処理 or 起票で完結）

## サブタスク管理

- [ ] A01〜A11 の検出方法・evidence path・escalation・起票テンプレを確定
- [ ] 全 workflow 走査ゲートを Phase 11 完了前 / G4 直前の 2 回実行する伝達を runbook に組み込む
- [ ] secret leak ゲート 2 回実行ポイントを runbook に伝達
- [ ] audit 突合 3 系統（Cloudflare / GitHub / CloudTrail）の検証コマンドを `outputs/phase-06/main.md` に記録
- [ ] `outputs/phase-06/main.md` を作成

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。
- 異常系シナリオが 10 件以上定義されている（本 Phase は 13 件）
- 各シナリオに 検出方法 / evidence 保存先 / escalation / 起票テンプレ が揃っている
- secret leak 検出ゲートが機械検証可能なコマンドで提示されている
- audit 突合 3 系統（Cloudflare / GitHub / CloudTrail）が機械検証可能な形で提示されている
- 全 workflow 走査ゲートが 2 回実行ポイントとともに定義されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] CONST_007: 「Phase XX で対応」の先送り表現が含まれていない
- [ ] 本 Phase で deploy / commit / push / PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] secret 値を含む log を evidence に保存しない設計になっている

## 次 Phase への引き渡し

Phase 7 へ:

- 異常系シナリオ A01〜A11 と AC のクロス対応
- secret leak ゲート / 全 workflow 走査ゲート / audit 突合 3 系統 を AC に組み込む指示
- 起票テンプレ（A01〜A11 のうち成立条件があるもの）

## 実行タスク

- [ ] phase-06 の既存セクションに記載した手順・検証・成果物作成を実行する。
