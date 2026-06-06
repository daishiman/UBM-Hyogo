## メタ情報

```yaml
issue_number: 1137
task_id: task-issue-1036-followup-006-bulk-tag-production-runtime-smoke
task_name: bulk tag endpoint の production runtime smoke 拡張
category: 改善
target_feature: apps/api POST /admin/members/tags/bulk（production runtime smoke）
priority: 低
scale: 中規模
status: 未実施
source_phase: issue-1081-bulk-tag-real-d1-runtime-smoke Phase 12 unassigned-task-detection UT-CANDIDATE-1 / Phase 10 MINOR M-2
created_date: 2026-06-03
dependencies: [issue-1081-bulk-tag-real-d1-runtime-smoke, issue-1036-bulk-member-tag-assign]
spec_path: docs/30-workflows/unassigned-task/task-issue-1036-followup-006-bulk-tag-production-runtime-smoke.md
```

| 項目 | 内容 |
|------|------|
| 優先度 | 低 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---
## 1. 概要

issue-1081（`bulk-tag-real-d1-runtime-smoke`）は staging 専用 test member / test tag を使った `POST /admin/members/tags/bulk` の real D1 mutation smoke gate を確立した。runner（`scripts/smoke/runtime-tag-bulk.sh`）は `--env staging` 固定で、`assert_staging_guard` により production marker / D1 名不一致時に exit 2 で構造的にブロックされる。本タスクは staging gate が安定運用フェーズに入った後、production の real D1 に対する bulk tag mutation smoke へ拡張する。production への書き込み副作用は本番会員データへ及ぶため、allowlist subject（production 専用 host regex）+ production 専用 test fixture prefix + 二重承認 gate の設計が staging とは桁違いに厳しく、issue-1081 本体とは別物として切り出す。

`POST /admin/members/tags/bulk`（issue-1036 で landed 済・本タスクで変更しない）の実 contract は `200 + {batchId, results:[{memberId,tagId,status}]}`、status ∈ `assigned` / `noop` / `unassigned` / `skipped_deleted` / `tag_not_found`。パッケージ名は `@ubm-hyogo/api`（issue 本文に出る `@repo/api` は誤りのため使用しない）。

## 2. 目的

- staging gate の安定運用後、production Workers runtime + production real D1 で bulk tag endpoint が contract 通り動くことを confidence をもって確認できる runtime evidence 経路を整備する。
- production への書き込み smoke を、本番会員データへ混入・残留させずに安全に実行する fixture / cleanup / 承認設計を確立する。
- staging runner の安全 guard（`assert_staging_guard`）を退化させずに、production 拡張を別経路として共存させる。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | production 専用の allowlist host regex を導入し、production endpoint（production Workers URL / `ubm-hyogo-db-prod`）にだけマッチする。staging allowlist とは独立して評価する |
| AC-2 | production 専用 fixture prefix（例: `e2e_test_prod_*` 系）を staging の `e2e_test_issue1081_` と分離して固定し、production smoke は当該 prefix のデータにのみ作用する |
| AC-3 | production smoke は二重承認 gate（明示 approval marker × 2、CI 自動実行不可）後のみ seed / POST / cleanup を実行する |
| AC-4 | smoke 終了時に cleanup 残件 0 を assert する（`<prod fixture prefix>` の member / tag / member_tags / audit 行が残らないことをクエリで確認）。残件があれば FAIL |
| AC-5 | production smoke の audit parity を確認する（assign / unassign の action / batchId / count が contract 通りで、production audit に test 行が残留しない） |
| AC-6 | 既存 staging runner の `assert_staging_guard`（`--env staging` 固定 / production marker・`ubm-hyogo-db-staging` 名不一致時 exit 2）が非退化であることを既存 local test の PASS で確認する |
| AC-7 | command log に production endpoint URL、request body redaction、response summary、audit count query、cleanup query が残り、bearer / token 実値は redact される |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260603-180735-wt-10/scripts/smoke/runtime-tag-bulk.sh`（`assert_staging_guard`）
- 症状 / 設計上の難所:
  - staging runner の `assert_staging_guard`（runtime-tag-bulk.sh:122-）は `CF_D1_DATABASE != ubm-hyogo-db-staging` や `BASE` に `production|ubm-hyogo-api-production` が含まれる場合に refuse する。これは production 誤実行を **意図的にブロック** する安全機構であり、production 拡張は guard の単純な無効化・緩和ではなく、「production 専用の allowlist host regex + production 専用 fixture prefix + 二重承認 gate」を**別途設計**する必要がある。guard を緩めると staging smoke の安全性が損なわれるトレードオフがあるため、staging guard はそのまま温存し、production 経路は別 runner / 別関数として共存させること。
  - production の real D1 に synthetic test member / test tag を投入する mutation smoke は、本番会員データへの混入・残留リスクが staging と段違い。`e2e_test_*` prefix の cleanup 漏れが staging では無害でも production では実害（公開ディレクトリ / 会員マイページへの露出、audit 汚染）になる。fixture prefix を staging と分離し、cleanup 残件 0 を smoke の終了条件にする。
  - production runtime は書き込み副作用 + 本番誤実行リスクのため user-gated。CI 自動実行ではなく、明示承認 marker（二重）後のみ実行する。staging gate（`.github/workflows/runtime-smoke-staging.yml` の `bulk-tag-runtime-smoke`）の CI 自動実行モデルとは別運用とする。
- 参照: `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-12/implementation-guide.md`, 先行事例 `#922`（admin GET runtime smoke の production 層展開）

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| production real D1 に test data が残留する | 高 | production 専用 fixture prefix を固定し、smoke 終了時に cleanup 残件 0 を assert（AC-4）。残件あれば FAIL |
| production endpoint への誤実行 | 高 | production 専用 allowlist host regex を独立評価（AC-1）。staging guard は温存し production 経路は別 runner / 別関数で分離 |
| staging guard の退化 | 高 | `assert_staging_guard` を変更せず、既存 local test の PASS で非退化を確認（AC-6） |
| 本番会員データへの synthetic data 混入が公開面に露出 | 高 | fixture prefix を staging と分離（AC-2）、cleanup 残件 0 assert（AC-4）、production audit に test 行を残さない（AC-5） |
| production smoke が承認なしに走る | 高 | 二重承認 gate（marker × 2、CI 自動実行不可）後のみ seed / POST / cleanup（AC-3） |
| admin bearer / token をログへ出す | 高 | request log は token / body secret を redact し、header value を出力しない（AC-7） |

## 検証方法

### 単体検証

```bash
# staging runner の local test 非退化（guard 退化なし）
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh
```

期待: 既存 staging runner の local test が PASS。`assert_staging_guard` を含む staging 経路の挙動が退化していないことを確認する（AC-6）。

### 統合検証

```bash
# 二重承認 marker 後のみ実行（production real D1 mutation）
# bearer / token は <redacted> でログに実値を残さない
bash scripts/smoke/runtime-tag-bulk.sh production \
  --out-dir docs/30-workflows/<this-workflow>/outputs/phase-11/evidence \
  --ci-summary
# 内部で seed → assign(200/assigned) → retry(200/noop) → unassign(200/unassigned)
#   → audit parity query → cleanup(残件0 assert) を production allowlist host にのみ実行
```

期待: production endpoint URL、request body redaction、response summary、audit count query、cleanup query の各ログが保存され、cleanup 残件 0 が assert される。`<redacted>` はログに実値を残さない。CI 自動実行ではなく二重承認 marker 後のみ走る。

## スコープ

### 含む

- production 用 runner 拡張 or 派生（staging runner と guard を共存させる別経路）
- production 専用 seed / cleanup fixture（staging と分離した prefix）
- production 専用 allowlist host regex + 二重承認 gate 設計
- production runtime evidence（Phase 11 / Phase 12 ledger 更新）

### 含まない

- staging runner の設計変更（issue-1081 本体 = `bulk-tag-real-d1-runtime-smoke`）
- `POST /admin/members/tags/bulk` endpoint 本体の設計変更（issue-1036 で landed 済）
- commit / push / PR 作成

## 参照

- `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-12/implementation-guide.md`
- `scripts/smoke/runtime-tag-bulk.sh`
- `.github/workflows/runtime-smoke-staging.yml`
- 先行事例: `#922`（issue-864-followup-001 / authenticated /admin GET runtime smoke gate の production 層展開・CLOSED）
