# Phase 10 Output: 最終レビュー — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

Status: spec_created
Runtime evidence: pending_user_approval（Phase 11 着手の最終 gate）

## 1. Phase 1-9 統合サマリ

| Phase | 主成果物 | 状態（spec 段階） |
| --- | --- | --- |
| 1 | 要件定義（5 AC × evidence path、13 ステップ、自走禁止操作） | spec_created |
| 2 | 設計（state machine 17 step、依存 matrix、evidence path 完全列挙） | spec_created |
| 3 | 設計レビュー（採用方針：cf.sh + D1 backup 必須 + 手動 24h + in-place deploy + 最小単位 rollback） | spec_created |
| 4 | テスト戦略（verify suite × AC マッピング） | spec_created |
| 5 | 実装ランブック（13 ステップ + approval gate） | spec_created |
| 6 | 異常系検証（リスク R1-R12 + rollback 8 ケース） | spec_created |
| 7 | AC マトリクス（5 AC × evidence path × 検証手段） | spec_created |
| 8 | DRY 化（命名規則 / cf.sh 一元化 / deploy 経路 / redaction 規則） | spec_created |
| 9 | 品質保証（6 軸品質ガード + preflight + 二重承認） | spec_created |

すべて outputs に具体内容で記載済み。1 Phase でも flat template のままなら **NO-GO**。

## 2. AC × evidence path 最終確認（5 AC）

| AC | 内容 | evidence path | 検証手段 | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | user approval evidence が保存される | `outputs/phase-11/user-approval-log.md` | Phase 10 / 11 / 13 の 3 段 approval ログ集約 | spec_covered |
| AC-2 | production D1 migration が Applied として確認される | `d1-migrations-list-{before,after}.txt`, `d1-migrations-apply.txt`, `d1-backup-<ts>.sql` | apply 前後の list 比較 | spec_covered |
| AC-3 | api/web production deploy が exit 0 | `api-deploy.log`, `web-deploy.log` | `bash scripts/cf.sh deploy --config <wrangler.toml> --env production` stdout/stderr 全文 | spec_covered |
| AC-4 | production public/member/admin smoke が green | `smoke-{public,member,admin}.md`, `smoke-screenshots/*.png` | 10 ルート HTTP status + authz boundary + VISUAL | spec_covered |
| AC-5 | release tag と 24h verification summary が保存される | `release-tag.txt`, `24h-verification-summary.md`, `24h-metrics-screenshots/*.png` | git tag + Cloudflare metrics 24h 後 | spec_covered |

5 AC × evidence path の 1:1 対応は崩れていない。

## 3. GO / NO-GO 判定 5 条件

production deploy 着手の最終 gate として、次の 5 条件すべて PASS で **GO**。1 条件でも NO-GO なら Phase 11 に進めない。条件付き GO（PASS_WITH_BLOCKER）は **AC-5（24h verification）の 24h 経過待ち** のみ許容し、それ以外は採用しない。

### GO 判定 5 条件

| # | 条件 | GO 基準 | NO-GO 基準 | 確認 evidence |
| --- | --- | --- | --- | --- |
| 1 | **上流 green** | 09a-A staging smoke / 09b-A observability / 09b-B post-deploy smoke が **3/3 green** で `outputs/phase-11/upstream-green-evidence.md` に citation あり | 1 件でも未 green / 未 citation | `upstream-green-evidence.md` |
| 2 | **静的検証 PASS** | typecheck / lint / build が **3/3 exit 0** で `outputs/phase-11/preflight-{typecheck,lint,build}.md` に記録 | 1 件でも fail / 記録なし | `preflight-*.md` |
| 3 | **redaction クリーン** | secret 値混入 / wrangler 直書き / .env 平文の **3 grep が 0 hit** | 1 件でも hit | `redaction-check.md` |
| 4 | **runbook + approval gate 整合** | Phase 5 runbook 13 ステップに 4 mutation approval（D1 apply / API / Web / release tag push）+ Phase 10 reviewer + Phase 13 user の **6 gate** が明示配置 | 1 gate でも欠落 / 配置誤り | `outputs/phase-05/main.md` + `outputs/phase-10/main.md` |
| 5 | **不変条件 #5 / #6 / #14 spec 整合** | smoke 分離（#5）/ web bundle に D1 import なし（#6）/ free-tier 見積 PASS（#14）の **3/3 spec_covered** | 1 件でも未整合 | `outputs/phase-11/invariants.md`（事前ステージ）+ build artifact grep |

### 条件付き GO（PASS_WITH_BLOCKER）の境界

| 採否 | 条件 | 根拠 |
| --- | --- | --- |
| **採用** | AC-5（24h verification summary）が 24h 経過待ちで未収集 | 24h 待機は構造的に避けられない外部依存。Phase 11 step 17 で取得することを前提に Phase 10 GO は出せる |
| **不採用** | 上流 green 未確認 | upstream blocker は Phase 11 着手以前の前提条件 |
| **不採用** | 静的検証 fail | mutation 着手前に必ず PASS を要求 |
| **不採用** | redaction hit | secret leak リスクは即停止案件 |
| **不採用** | approval gate 欠落 | 監査破綻 |
| **不採用** | 不変条件違反 | 設計レベルの整合性破綻 |

すなわち PASS_WITH_BLOCKER は **24h verification の時間軸的待機** だけを許容し、品質・整合性に関する blocker は採用しない。

### NO-GO 時の停止挙動

- Phase 11 を着手しない（user approval を取得しても進めない）
- blocker を後述 §6 のテンプレで `outputs/phase-10/main.md` 末尾に追記
- 差し戻し先（09a-A / 09b-A / 09b-B / feature ブランチ等）に escalate
- blocker 解消後、Phase 10 を再評価

## 4. runbook approval gate 配置の最終確認

| step | 内容 | gate | 配置先 |
| --- | --- | --- | --- |
| 1 | main_merge | Phase 13 user approval | `outputs/phase-13/main.md` |
| 0 / pre-flight | upstream_check + 静的検証 | Phase 10 reviewer | `outputs/phase-10/main.md` |
| 6 | D1 migration apply | Phase 11 user approval | `outputs/phase-11/user-approval-log.md` § d1-apply |
| 9 | API deploy | Phase 11 user approval | 同 § api-deploy |
| 11 | Web deploy | Phase 11 user approval | 同 § web-deploy |
| 13 | release tag push | Phase 11 user approval | 同 § release-tag |
| step 16 / rollback | rollback 実行 | Phase 11 user approval（発生時のみ） | 同 § rollback |

6 gate（Phase 10 reviewer + Phase 11 mutation × 4 + Phase 13 user）+ 緊急 rollback 1 gate が runbook で実際に固定されていれば PASS。

## 5. rollback 妥当性確認（Phase 2 §4 の 8 ケース）

| ケース | アクション | apps/web から D1 直操作 | 妥当性 |
| --- | --- | --- | --- |
| step 4 失敗（D1 backup） | 再試行 / incident escalate | なし | OK |
| step 7 失敗（D1 apply） | forward migration で修復 / 破壊的 SQL 禁止 | なし | OK |
| step 10 失敗（API deploy） | `bash scripts/cf.sh rollback <prev-version>` | なし | OK |
| step 12 失敗（Web deploy） | Cloudflare Dashboard で前 deployment へ戻す | なし | OK |
| step 14 失敗（release tag） | timestamp 更新で再作成 | なし | OK |
| step 15（smoke）5xx / authz violation | worker / pages / D1 を最小単位で巻き戻す | **禁止**（apps/web から D1 直は #6 違反） | OK（禁止条項あり） |
| step 17（24h）閾値超過 | 09b incident response runbook へ escalate | なし | OK |
| 上流未 green | 待機（execution 開始しない） | なし | OK |

8 ケースすべて妥当。`apps/web` D1 直操作の禁止が明示されており、不変条件 #6 は守られる。

## 6. 24h verification 外部依存経路の citation

| 取得対象 | 経路（再掲） | citation 妥当性 |
| --- | --- | --- |
| Workers requests / errors | Cloudflare Dashboard 目視 + screenshot → `24h-metrics-screenshots/workers-requests-<ts>.png` | OK（手動 / 24h 待機） |
| D1 read/write rows | Cloudflare Dashboard 目視 + screenshot → `24h-metrics-screenshots/d1-rows-<ts>.png` | OK |
| `sync_jobs` 状況 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --env production --command "SELECT status, COUNT(*) FROM sync_jobs GROUP BY status"` → `24h-verification-summary.md` 内 | OK（read-only SQL） |
| Sentry events 24h | 09b-A 経由通知 | OK（半自動） |
| Slack incident 通知 | 09b-A 経由通知 | OK |

すべて citable / 経路固定。MVP では Analytics API 自動収集はスコープ外（手動取得）。

## 7. blocker テンプレ

NO-GO の場合、次のテンプレで列挙し、解消後に再判定する。

```md
## Blocker

| # | blocker | 検出 phase / step | 差し戻し先 | 解消条件 |
| --- | --- | --- | --- | --- |
| B-1 | 09a-A staging smoke が green でない | Phase 10 step 1 | 09a-A の Phase 11 | smoke-public/member/admin が 200 / authz green |
| B-2 | typecheck fail | Phase 10 step 2 | feature ブランチ | preflight-typecheck.md exit 0 |
| B-3 | secret 値混入 | Phase 10 step 3 | 該当行修正 | redaction-check.md grep 0 hit |
| B-4 | runbook approval gate 欠落 | Phase 10 step 4 | Phase 5 修正 | 6 gate 配置 |
| B-5 | apps/web → D1 直 import 残存 | Phase 10 step 5 | apps/web 修正 | grep 0 hit |
```

実 blocker は Phase 11 着手前 preflight で発覚した場合に追記する。

## 8. Reviewer Sign-off

```md
## Reviewer Sign-off

- reviewer: <reviewer name>（solo dev のため self-review）
- reviewed_at: <YYYY-MM-DDThh:mmZ>
- judgment: GO / NO-GO / PASS_WITH_BLOCKER（24h 待機のみ）
- approval_gate: PRODUCTION DEPLOY GATE 1/3
- next_phase: 11（GO 時）/ blocker 解消（NO-GO 時）
```

solo dev でも sign-off は省略しない（CLAUDE.md の品質保証ポリシー）。self-review 区分を明記する。

## 9. Approval Gate 1/3 メッセージ

```text
[ APPROVAL REQUIRED - PRODUCTION DEPLOY GATE 1/3 (REVIEWER) ]
Wave: 9c-fu
Task: 09c-A-production-deploy-execution
Phase: 10 (最終レビュー)

5-axis judgment:
  [1] upstream green: PASS / FAIL
  [2] preflight static check: PASS / FAIL
  [3] redaction: PASS / FAIL
  [4] runbook approval gate: PASS / FAIL
  [5] invariants #5/#6/#14: PASS / FAIL

Blockers: <list or 0 件>

Next-phase mutation impact:
  - Phase 11 step 6: D1 migration apply（mutation, irreversible without backup）
  - Phase 11 step 10: API production deploy（traffic 影響）
  - Phase 11 step 12: Web production deploy（traffic 影響）
  - Phase 11 step 14: release tag push（git remote mutation）

Sign-off (self-review): [y/N]
```

## 10. Phase 11 への引き渡し（実行順序の最終確定）

GO 判定後、Phase 11 は次の順序で実行する。各 mutation 直前に user approval を取得する。

| # | step | 種別 | approval | evidence |
| --- | --- | --- | --- | --- |
| 0 | upstream_check | read-only | — | `upstream-green-evidence.md` |
| 1 | main_merge | mutation（git） | Phase 13 既取得 | `main-merge-commit.txt` |
| 2 | identity_check | read-only | — | `cf-whoami.txt` |
| 3 | d1_backup | read-only（出力） | — | `d1-backup-<ts>.sql` |
| 4 | d1_list_before | read-only | — | `d1-migrations-list-before.txt` |
| 5 | **approval (D1 apply)** | gate | Phase 11 #1 | `user-approval-log.md` § d1-apply |
| 6 | d1_apply | mutation（D1） | — | `d1-migrations-apply.txt` |
| 7 | d1_list_after | read-only | — | `d1-migrations-list-after.txt` |
| 8 | **approval (API deploy)** | gate | Phase 11 #2 | `user-approval-log.md` § api-deploy |
| 9 | api_deploy | mutation（Worker） | — | `api-deploy.log` |
| 10 | **approval (Web deploy)** | gate | Phase 11 #3 | `user-approval-log.md` § web-deploy |
| 11 | web_deploy | mutation（Worker） | — | `web-deploy.log` |
| 12 | **approval (release tag)** | gate | Phase 11 #4 | `user-approval-log.md` § release-tag |
| 13 | release_tag + push | mutation（git remote） | — | `release-tag.txt` |
| 14 | runtime_smoke | read-only | — | `smoke-{public,member,admin}.md` + screenshots |
| 15 | invariant_check | read-only | — | `invariants.md` |
| 16 | verify_24h | read-only（24h 後） | — | `24h-verification-summary.md` + screenshots |

`bash scripts/cf.sh` 経由のみで実行。`wrangler` 直接禁止。secret 値転記禁止。

## 11. 結論

Phase 1-9 の成果物は具体内容で揃い、5 条件 GO 判定基準で最終評価が可能。runbook approval gate 6 種、rollback 8 ケース、24h verification 外部依存はすべて citable。reviewer sign-off により Phase 11 へ進む準備が整う。

5 条件のうち 1 件でも fail なら NO-GO で停止し、blocker 解消まで Phase 11 着手を禁止する。
