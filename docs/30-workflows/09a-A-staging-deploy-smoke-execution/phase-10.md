# Phase 10: 最終レビュー — 09a-A-staging-deploy-smoke-execution

[実装区分: 実装仕様書]

判定根拠: Phase 11 で取得する 13 evidence・4 approval gate（G1 deploy / G2 D1 migration / G3 Forms sync / G4 09c blocker 更新）が、不変条件・secret 漏洩・free-tier・rollback 動作確認・branch protection を含む観点で完備しているかを最終判定する。実 staging への副作用結果に対するレビューであり docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09a-A-staging-deploy-smoke-execution |
| phase | 10 / 13 |
| wave | 9a-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 9 の品質ゲートを通過した evidence 一式 + ドキュメント更新差分について、最終レビュー観点（不変条件 / secret / production 影響 / approval gate / evidence 完備 / blocker 更新 / rollback 確認 / free-tier / redact / governance / CHANGELOG / skill feedback）を満たすか self-review し、Phase 11 の合否と Phase 13 PR 作成可否を判定する。

## レビュー観点チェックリスト（最低 15 項目）

| # | 観点 | 検証手段 | 合格基準 |
| --- | --- | --- | --- |
| R01 | 不変条件 #5（public/member/admin boundary） | `curl-authz-*.log` の status 確認、Playwright admin route の role 別結果 | 未認証 `/me` = 401、未認証 `/admin/*` = 401/403、member role の `/admin/*` = 403 |
| R02 | 不変条件 #6（apps/web から D1 直アクセス禁止） | `apps/web` の grep（`d1` / `D1Database` 直 import 不在）+ smoke 中の Workers ログで web→api 経由のみ観測 | 直 import 0 件 |
| R03 | 不変条件 #14（Cloudflare free-tier） | `qa-free-tier.md` の Workers req / D1 read / Forms quota 記録 | free-tier 上限の 80% 未満、超過時は 09c blocker に追記済 |
| R04 | secret 漏洩なし | `qa-secret-leak.log` 0 行、commit 直前 `git diff` 目視 | 0 hit |
| R05 | production への書き込みなし | コマンド履歴の grep（`--env production` の使用は `PRAGMA` / `SELECT` / `migrations list` のみ） | mutation 系（`apply` / `INSERT` / `UPDATE` / `DELETE` / `import`）の `--env production` 0 件 |
| R06 | approval gate 4 種すべて取得済の記録 | `outputs/phase-11/main.md` に G1〜G4 の承認時刻 / 承認テキストの転写 | 4 件すべて記録 |
| R07 | 13 evidence すべて > 0 byte | Phase 9 Step B / `qa-evidence-presence.log` | `EMPTY:` / `MISSING:` 0 行 |
| R08 | placeholder `NOT_EXECUTED` 不在 | `qa-placeholder.log` | 0 hit |
| R09 | 09c blocker 更新済 | `task-09c-production-deploy-execution-001.md` の差分 / `qa-blocker-update.diff` | 「09a-A 実測完了済 / 残課題」セクション存在 |
| R10 | 親タスク `artifacts.json` 更新済 | `09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json` の phase state | 実測完了状態に遷移済 |
| R11 | rollback 手順動作確認済 OR 取得不能理由記録 | deploy 直前の `cf.sh deployments list` 出力 + rollback 試行ログ（dry-run 可）または取得不能理由 | version ID 取得済、または `outputs/phase-11/main.md` に取得不能理由 |
| R12 | free-tier 制限内（D1 read 量、Workers req 数、Forms quota） | R03 と同じ。Forms quota は schema 1 + responses 1 サイクルで枯渇していないこと | 上限 80% 未満 |
| R13 | redact 完全（`Bearer\|token=\|sk-\|API_KEY=\|password=` 0 hit） | Phase 9 Q4 / Step E | 0 hit |
| R14 | branch / PR タイトル命名規約遵守 | branch 名が `feat/`・`fix/`・`refactor/`・`docs/` のいずれかで始まること、PR タイトル < 70 字 | 規約一致 |
| R15 | CHANGELOG / 関連 README 更新（必要なら） | 本タスクは仕様書 + evidence のみのため CHANGELOG 不要を明記。infra runbook (`specs/15-infrastructure-runbook.md`) の参照リンクを更新する場合のみ追記 | 不要記載 OR 更新差分が PR に含まれる |
| R16 | skill feedback / unassigned-task の漏れなし | Phase 6 異常系で発見した issue / Phase 8 で起票した helpers task / Phase 9 で起票した parity follow-up が `unassigned-task/` に揃っている | 漏れ 0 件 |
| R17 | solo-dev branch protection 不変条件遵守 | `gh api repos/daishiman/UBM-Hyogo/branches/main/protection` で `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` | drift 0 |
| R18 | placeholder と実測 evidence が物理パス分離 | `outputs/phase-11/evidence/` 配下に NOT_EXECUTED テキストが 0、親タスクの placeholder が本タスク evidence への参照リンクに置換済 | 分離維持 |
| R19 | D1 schema parity 完了 | `d1-schema-parity.json.summary.diffCount = 0`、または follow-up unassigned-task 起票済 | どちらか満たす |
| R20 | 09a-A 内の AC 8 件すべてに対応する evidence が存在 | Phase 7 AC マトリクスとの突合 | 8 / 8 PASS（または許容済 soft fail） |

## レビュー実施手順

### Step 1: self-review（1 周目）

1. `outputs/phase-11/evidence/` を一覧し、Phase 9 の Step A〜F を再実行する。
2. 上表 R01〜R20 を順に埋めていく。各観点で PASS / FAIL / N/A のどれかに分類する。
3. PASS の根拠は evidence ファイル名 + 行番号 / hash で示す。
4. FAIL は blocker として一覧化する。

### Step 2: blocker 仕分け

| blocker 種別 | 分岐先 |
| --- | --- |
| Phase 6 異常系で対応可能（再 deploy / 再 smoke / Forms 再実行） | Phase 6 に戻す |
| Phase 9 品質ゲート再実行で解消可能（lint / redact） | Phase 9 に戻す |
| 本タスク scope 外（schema drift / boundary 違反 / バグ） | `unassigned-task/` 起票で 09c の blocker に移譲 |
| approval 未取得 | G1〜G4 の該当ゲートで再承認取得 |

CONST_007 に従い「Phase 11 で対応」「Phase 12 で記録」型の先送りは禁止。本 Phase で blocker をいずれかの分岐先に必ず割り当てる。

### Step 3: GO / NO-GO 判定

- R01〜R20 のうち hard 観点（R01〜R10, R13, R17, R19, R20）すべて PASS → GO
- soft 観点（R11 wrangler tail / R12 free-tier / R15 CHANGELOG / R16 skill feedback）の FAIL は理由記録で続行可
- 1 つでも hard FAIL → NO-GO（Step 2 で分岐先を確定し、本 Phase を再実施）

### Step 4: レビュー記録

`outputs/phase-10/main.md` に以下を要約として保存する:

- レビュー観点表（R01〜R20）の判定結果
- blocker 一覧（種別 / 分岐先 / 起票 unassigned-task のリンク）
- GO / NO-GO 判定と根拠
- Phase 13 PR 作成許可の有無
- 残課題が 09c に移譲された場合は移譲先（`task-09c-production-deploy-execution-001.md`）と移譲内容

## レビュー記録の保存先

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/main.md` | 上記 Step 4 の要約と blocker 一覧 |
| `outputs/phase-11/evidence/qa-final-review.log` | R01〜R20 の判定結果（grep 可能なフラットテキスト） |
| `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` | 移譲した残課題（R09 / R16 と同期） |

## 参照資料

- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-01.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-02.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-03.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-08.md`
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-09.md`
- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`
- `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/artifacts.json`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `CLAUDE.md`（branch protection / Cloudflare CLI / sync-merge ポリシー）

## 統合テスト連携

- 上流: 08a coverage gate, 08a-B `/members` search/filter coverage, 08b E2E evidence
- 下流: 09c production deploy execution（GO 判定が 09c の前提）

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 が R01 / R02 / R03 / R12 で二重に検証されている
- secret 漏洩がコマンド grep（R04 / R13）と目視（R04 git diff）で二重ガード
- production への副作用が R05 で完全 read-only に限定されている
- approval gate 4 種が R06 で必ず記録されている
- placeholder と実測 evidence の分離が R08 / R18 で機械検証されている
- governance 観点（R14 / R17）と skill feedback / unassigned-task（R16）が漏れない
- CONST_007: 先送り禁止（Step 2 で必ず分岐先を確定）

## サブタスク管理

- [ ] R01〜R20 を順に判定
- [ ] blocker を Phase 6 / Phase 9 / unassigned-task / G1〜G4 のいずれかに分岐
- [ ] GO / NO-GO 判定を確定
- [ ] `outputs/phase-10/main.md` を作成
- [ ] `outputs/phase-11/evidence/qa-final-review.log` を生成
- [ ] 09c blocker 更新内容を `task-09c-production-deploy-execution-001.md` と同期

## 成果物

- `outputs/phase-10/main.md`
- `outputs/phase-11/evidence/qa-final-review.log`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- レビュー観点 R01〜R20 すべてに PASS / FAIL / N/A の判定が付いている
- すべての FAIL に分岐先（Phase 6 / Phase 9 / unassigned-task / G1〜G4 再承認）が割当済
- GO / NO-GO 判定が記録されている
- Phase 13 PR 作成可否が明記されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で deploy / commit / push / PR を実行していない
- [ ] CONST_007 違反（「Phase XX で対応」型の先送り）が無い
- [ ] solo-dev branch protection 不変条件（R17）を侵していない

## 次 Phase への引き渡し

Phase 11 へ:
- GO 判定された evidence 一式とその hash 記録
- NO-GO の場合の分岐指示（戻し先 Phase / 起票する unassigned-task）
- Phase 13 PR 作成可否
- 09c へ移譲する残課題（`task-09c-production-deploy-execution-001.md` 更新差分）

## 実行タスク

- [ ] phase-10 の既存セクションに記載した手順・検証・成果物作成を実行する。
