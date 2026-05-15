# Phase 12 — strict 7 outputs + system spec 同期 + unassigned task formalize

> 親 workflow: `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/`
> 適用テンプレ: `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs / 短縮名禁止 / 3 値語彙 / same-wave sync）
> compliance output: `outputs/phase-12/phase12-task-spec-compliance-check.md`
> 起点 lessons-learned: L-E2EQU3B-002 / L-E2EQU3B-004（`spec_created` と runtime evidence を混同しない）

## メタ情報

| key | value |
|-----|-------|
| Phase | 12 |
| Phase Name | close-out compliance + system spec 同期 |
| 作成日 | 2026-05-14 |
| 前 Phase | 11 |
| 次 Phase | 13 |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state（本 phase 着手時） | `spec_created`（実装未実行） |
| workflow_state（本 phase 終了時） | `spec_created` 維持（実コード + local 8 evidence 取得後に `runtime_pending` 昇格） |
| Issue 参照方針 | `Refs #667`（Issue は CLOSED のまま、reopen しない） |

## 目的

実コード・focused Phase 11 local evidence は生成済みであるため、Phase 12 の **strict 7 outputs** を runtime-pending close-out として欠落ゼロで生成し、aiworkflow-requirements 正本台帳・元 unassigned task・task-specification-creator feedback への same-wave sync を完了させる。`PASS` 単独表記を禁止し、`runtime_pending (local evidence captured)` / `completed (runtime PASS)` のサフィックスを必ず併記する。

## strict 7 outputs（逐語固定 / 短縮名禁止）

`outputs/phase-12/` 配下に以下 7 ファイルを **正規ファイル名のまま** 物理生成する。1 件でも欠落・短縮名は `phase12-task-spec-compliance-check.md` の総合判定を `FAIL` にする。

| # | ファイル | 由来 Task | 内容サマリ |
|---|----------|-----------|-----------|
| 1 | `outputs/phase-12/main.md` | Phase 12 本体 | Phase 12 全体サマリ / 7 outputs index / 同期 wave 結果 / 総合判定行（`spec_created` サフィックス必須） |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 1 | Part 1（中学生レベル: mock とは「本物の代わりに決まった答えを返す案内係」例え話）+ Part 2（技術者: contracts package API / safeJson ラッパー / fixtures shape / readiness wait pattern / TypeScript 型定義） |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 2 | aiworkflow-requirements `quick-reference` / `resource-map` / `task-workflow-active` への登録差分 + 新規 artifact inventory `workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory.md` 作成差分 |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 3 | `index.md` の状態行確認 / skill feedback promotion / unassigned-task `implemented_local_runtime_pending` 更新の差分一覧 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 4 | mock 拡張で見えた将来 follow-up（後述「6. unassigned 候補」） / 0 件でも本ファイル必須 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 5 | task-specification-creator skill への feedback（3 観点固定: テンプレート / ワークフロー / ドキュメント。改善なしでも本ファイル必須） |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6（最終確認） | vocabulary canonical 値（`spec_created` / `runtime_pending` / `completed`）の machine-validate gate 結果 + 7 outputs 実体 + same-wave sync 証跡 |

> 短縮名（`impl-guide.md` / `feedback-report.md` / `compliance-check.md` 等）の使用は禁止。`phase-12-spec.md` §「strict 7 file names は逐語固定」参照。

## 1. main.md の必須セクション

- 7 outputs index（path + 1 行サマリ）
- 総合判定行: `phase12-status: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING — implementation exists / focused local evidence captured / CI runtime pending`
- same-wave sync の結果（後述「3. 同期 wave」）
- L-E2EQU3B-002 の vocabulary 適用結果（artifacts.json `workflow_state` の値）

## 2. implementation-guide.md の構成

### Part 1（中学生レベル）

- 例え話: 「テストのときに本物のお店に毎回行くのは大変。だから “お店の代わりに決まった答えを返してくれる案内係” を 1 人だけ用意する」
- なぜ必要か → 何をするか の順
- 専門用語セルフチェック表（5 用語以上 / 「API」「mock」「契約」「テスト」「CI」を日常語に言い換え）

### Part 2（技術者レベル）

- `packages/contracts/` 公開 API（zod schema 一覧 + named export aggregator）
- `safeJson(res, status, body, schema)` ラッパーの型シグネチャ + parse 失敗時 HTTP 500 + `{ zodIssues: [...] }` の error response shape
- `fixtures` namespace の canonical 構造（member 3 / zone 2 / membership 2 / negative case `zzz_no_match_zzz` / tag facet 2）
- contract test の起動戦略（別ポート 38787 / SIGTERM 終了 / beforeEach reset）
- readiness wait pattern（`curl --retry` bash loop / 30 秒 timeout）
- `actions/upload-artifact@v4` の name / retention-days / path 設計
- 後続実装者向け Evidence Contract（local 8 evidence + CI runtime evidence の分離）

## 3. 同期 wave（system-spec-update-summary.md の必須項目）

| 同期先 | パス | 差分内容 | 同期タイミング |
|--------|------|----------|---------------|
| aiworkflow-requirements quick-reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 workflow ID + 1 行サマリ + canonical path 追記 | Phase 12 same-wave |
| aiworkflow-requirements resource-map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | `packages/contracts/` / `scripts/__tests__/` を新規 anchor として登録 | Phase 12 same-wave |
| task-workflow-active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 workflow を active として登録 / status `spec_created` | Phase 12 same-wave |
| 新規 artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory.md` | 本 workflow 全 artifact path + Phase ごとの owner 列挙 | Phase 12 same-wave（新規作成） |
| 元 unassigned task | `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md` | status を `implemented_local_runtime_pending` に更新 | Phase 12 same-wave |
| lessons-learned cross-link | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md` | 本 workflow への cross-link 追記 + L-E2EQU3B-002 / L-E2EQU3B-004 への back-ref | Phase 12 same-wave |
| LOGS row | `docs/30-workflows/LOGS.md`（または `.claude/skills/.../LOGS.md`） | 本 workflow の Phase 12 close-out 行を追記 | Phase 12 same-wave |

> 同期漏れは `compliance-check.md` 総合判定を `PASS_WITH_OPEN_SYNC` に格下げする。

## 4. artifacts.json の workflow_state 更新手順（L-E2EQU3B-002）

```bash
# root artifacts.json を編集（outputs/artifacts.json は本 workflow では作成しない）
# 1) metadata.workflow_state を spec_created に維持
# 2) metadata.implementation_status は設定しない（実装未実行）
# 3) phase[11].status / phase[12].status は spec_created に維持
# 4) 実コード + local 8 evidence 取得後に runtime_pending、CI runtime PASS 後に completed へ昇格
```

`compliance-check.md` の parity セクションには **`outputs/artifacts.json` 不在ケース** の文言テンプレを逐語コピーする:

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

## 5. compliance check 項目（phase12-task-spec-compliance-check.md）

| # | 観点 | 検証コマンド / 確認手段 | 期待 | サフィックス例 |
|---|------|------------------------|------|---------------|
| 1 | strict 7 outputs 実体 | `ls outputs/phase-12/ \| wc -l` | 7 | `runtime_pending (local evidence captured)` |
| 2 | 短縮名禁止 | `ls outputs/phase-12/` で 7 正規名のみ | OK | — |
| 3 | focused typecheck evidence | `outputs/phase-11/evidence/contracts-typecheck.log` | generated | `runtime_pending (local evidence captured)` |
| 4 | lint evidence | `outputs/phase-11/evidence/lint.log` | 未生成なら `spec_created` と明記 | 同上 |
| 5 | contracts test evidence | `contracts-test.log` | 未生成なら `spec_created` と明記 | 同上 |
| 6 | contract spec evidence | `contract-spec.log` | 未生成なら `spec_created` と明記 | 同上 |
| 7 | mock /health evidence | `mock-health-200.txt` | 未生成なら `spec_created` と明記 | 同上 |
| 8 | dispatcher count parity | `dispatcher-grep.txt` 行数 = `endpoint-inventory.md` 行数 | 未生成なら `spec_created` と明記 | 同上 |
| 9 | coverage ≥80% | `coverage-summary.json` 4 指標 | 未生成なら `spec_created` と明記 | 同上 |
| 10 | E2E regression | `e2e-chromium.log` 全 PASS | 未生成なら `spec_created` と明記 | 同上 |
| 11 | dirty-code gate | `git status apps/ packages/ scripts/ .github/ docs/` で本 workflow 外の dirty diff なし | OK | — |
| 12 | OKLch 不変条件 | `grep -nE "bg-\[#\|text-\[#" apps/web/src` | 0 hit | — |
| 13 | same-wave sync | §3 テーブル 7 項目すべて反映済み | OK | — |
| 14 | unassigned task formalize | `task-e2e-stage3b-mock-api-fixture-coverage-001.md` status 更新済み | OK | — |
| 15 | vocabulary 厳格 | `PASS` 単独表記が 7 outputs 内に 0 件 | OK | — |

## 6. unassigned-task-detection.md の候補（0 件でも本ファイル必須）

mock-api 拡張で見えた将来 follow-up を以下に列挙する。0 件であっても本ファイルは必須出力。

| # | 候補 | 根拠 | 推奨タスク名 |
|---|------|------|--------------|
| 1 | `admin/tags` / `admin/queue` の seed 拡充 | 現 fixtures は member 中心。tag facet / queue item の網羅は MVP scope 外 | `task-mock-admin-tags-seed-002.md` |
| 2 | `apps/api` 側 zod の `packages/contracts/` への完全移管 | 現状は re-export のみ。circular dep 回避と引き換えに drift 余地が残る | `task-api-zod-migrate-to-contracts-003.md` |
| 3 | `actions/upload-artifact@v4` 失敗時の retry 設計 | 現 patch は `if: always()` 一段。flaky 化時の即時再走経路が未設計 | `task-ci-upload-artifact-retry-004.md` |
| 4 | mock 全 endpoint への OpenAPI / JSON Schema export | contracts SSOT を外部公開する余地 | `task-contracts-openapi-export-005.md` |

> 0 件で close-out する場合も `unassigned-task-detection.md` の本文に「該当なし。検出スクリプト exit=0」と明記する。

## 7. skill-feedback-report.md（3 観点固定）

| 観点 | 記録内容（最小例） |
|------|-------------------|
| テンプレート改善 | NON_VISUAL × `implementation` × CI runtime pending の組合せ向け縮約テンプレが `phase-11-non-visual-alternative-evidence.md` 内に散在。`IMPLEMENTED_LOCAL_RUNTIME_PENDING` を独立サブセクション化する余地あり |
| ワークフロー改善 | `dispatcher-grep.txt` × `endpoint-inventory.md` の行数 parity を validator 化する script が未整備 |
| ドキュメント改善 | contract test 起動戦略（別ポート / SIGTERM）を再利用ガイドとして `references/patterns-testing.md` に追記する候補 |

> 改善点なしでも 3 観点それぞれ「該当なし」と明記する。

## 8. documentation-changelog.md の差分一覧

| 更新対象 | 差分種別 |
|----------|---------|
| `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/index.md` | workflow_state `spec_created` 維持 / Phase 11-12 は実装後昇格と明記 |
| `docs/30-workflows/unassigned-task/task-e2e-stage3b-mock-api-fixture-coverage-001.md` | status を `implemented_local_runtime_pending` に更新 / canonical workflow path 追記 |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md` | 本 workflow への cross-link 追記 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 workflow 登録行追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | `packages/contracts/` anchor 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active 登録 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-667-stage3b-mock-api-fixture-coverage-artifact-inventory.md` | 新規作成 |
| `docs/30-workflows/LOGS.md`（または該当 LOGS） | close-out 行追記 |

## 9. Step 1-A / 1-B / 1-C / Step 2 の判定

| Step | 判定 | 根拠 |
|------|------|------|
| Step 1-A 完了タスク記録 | 実施 | §3 同期 wave 全件 |
| Step 1-B 実装状況テーブル | `spec_created` を記録 | `runtime_pending` 昇格は local 8 evidence 後 |
| Step 1-C 関連タスクテーブル | unassigned task の status 更新 + 新規 follow-up 候補 4 件登録 | §6 |
| Step 2 新規 IF 追加 | **発火**（`@ubm-hyogo/contracts` 新パッケージ + zod schema 公開 API） | aiworkflow-requirements に新規 artifact inventory を作成 |

## 完了条件

- [ ] strict 7 outputs 全件物理存在（短縮名 0 件）
- [ ] §5 compliance check 15 項目すべて確認済み
- [ ] §3 same-wave sync 7 項目すべて反映済み
- [ ] root `artifacts.json` の `workflow_state` が `spec_created`（`outputs/artifacts.json` は不在前提）
- [ ] `unassigned-task-detection.md` に候補 4 件以上または「該当なし」明記
- [ ] `skill-feedback-report.md` に 3 観点記載（改善なしでも明記）
- [ ] 元 unassigned task `task-e2e-stage3b-mock-api-fixture-coverage-001.md` を `implemented_local_runtime_pending` に更新
- [ ] lessons-learned に本 workflow への cross-link 追記
- [ ] L-E2EQU3B-002 vocabulary（`runtime_pending` / `completed`）を `main.md` / `compliance-check.md` の双方に明記
- [ ] `PASS` 単独表記 0 件

## やってはいけないこと

- 短縮ファイル名（`impl-guide.md` / `feedback-report.md` 等）を 1 件でも使う
- `PASS` 単独表記を残す（必ず `runtime_pending` / `completed` サフィックス併記）
- CI runtime 未実行のまま `metadata.workflow_state = completed` を書く（L-E2EQU3B-002 違反）
- `unassigned-task-detection.md` を 0 件理由で省略する（0 件でも本ファイル必須）
- `outputs/artifacts.json` が存在しないのに「parity = 両者同期確認」テンプレ文言を残す

## タスク 100% 実行確認【必須】

- [ ] 7 outputs 全件作成
- [ ] same-wave sync 7 項目完了
- [ ] compliance check 15 項目記録
- [ ] artifacts.json 更新

## 次 Phase

Phase 13: PR 作成（ユーザー明示承認 gate / commit 粒度方針 / CI gate 確認）

## 補注: workflow_state と phases[].status は別軸

`artifacts.json` の `metadata.workflow_state`（workflow 全体の昇格状態）と `phases[N].status`（phase 単位の進捗）は別軸である。本 workflow では `workflow_state: "runtime_pending"` ∧ `phases[12].status: "completed"` を併記しているが、これは Phase 12 ドキュメント成果物（7 outputs）は揃っており、workflow 全体としては GitHub Actions runtime evidence / PR merge が user-gated で保留中であることを示す。詳細は `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md` §「workflow_state vs phases[].status 軸分離ルール」参照。
