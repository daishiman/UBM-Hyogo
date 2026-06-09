# Phase 9: 品質保証 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

本サイクルで通した gate と、production 実走時に評価する gate を一括定義し、line budget / link / mirror parity の判定方針を確定する。
本タスクは NON_VISUAL（CI / runtime smoke gate 拡張）であり、UI 意匠 gate（design-tokens / visual）は対象外。代わりに **shell test / actionlint / SQL prefix grep / redaction grep** が品質の中核となる。

## line budget / link / mirror parity の一括判定方針

| 観点 | 方針 |
| ---- | ---- |
| line budget | ドキュメント（runbook / phase-N.md）は冗長な再掲を避け、設計の実体は Phase 2 を正本として参照する。runner / SQL のコメント行は invariant 明記（synthetic prefix / dual-approval / 本番非露出）に限定し肥大化させない |
| link | 仕様書内の相対リンク（親タスク `issue-1081` / `issue-1036`、`scripts/smoke/runtime-tag-bulk.sh`、`apps/api/migrations/seed/*.sql`、`.github/workflows/production-runtime-smoke.yml`）が実在パスを指すことを確認。dangling link 0 |
| mirror parity | skill mirror（`.agents/skills` ↔ `.claude/skills`）は symlink 運用のため diff は自明 N/A。本タスクは skill 本体を変更しないため parity 影響なし |

## 本サイクルで通した gate

| # | gate | コマンド | 合否基準 |
| - | ---- | -------- | -------- |
| 1 | local shell test PASS | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | 全ケース PASS。新規 production guard ケース（no-approval / single-approval / wrong-host / wrong-d1 / missing-base）+ 既存 staging 非退化ケースが緑 |
| 2 | typecheck | `mise exec -- pnpm typecheck` | exit 0（本タスクは TS を変更しないが、リポジトリ全体の回帰がないことを確認）|
| 3 | lint | `mise exec -- pnpm lint` | exit 0 |
| 4 | workflow lint | `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/production-runtime-smoke.yml` | エラー 0。新規 job `bulk-tag-production-runtime-smoke` の YAML 構文 / `if` 式 / env マッピング / `workflow_dispatch.inputs` が妥当 |
| 5 | SQL prefix grep gate（seed/cleanup）| 下記「SQL prefix grep gate」参照 | seed/cleanup SQL が `e2e_test_prod_tagbulk_` のみを含み、staging prefix（`e2e_test_issue1081_`）を**含まない** |
| 6 | redaction grep gate | 下記「redaction grep gate」参照 | evidence / log / summary.json に bearer / token 実値が出力されない |

### gate 5: SQL prefix grep gate（production prefix 隔離）

production seed / cleanup SQL が production prefix のみを使い、staging prefix を混入させないことを静的に保証する。

```bash
# production SQL は e2e_test_prod_tagbulk_ を含む
grep -q 'e2e_test_prod_tagbulk_' apps/api/migrations/seed/bulk-tag-production-seed.sql
grep -q 'e2e_test_prod_tagbulk_' apps/api/migrations/seed/bulk-tag-production-cleanup.sql

# production SQL は staging prefix を含まない（混線防止・AC-2）
! grep -q 'e2e_test_issue1081_' apps/api/migrations/seed/bulk-tag-production-seed.sql
! grep -q 'e2e_test_issue1081_' apps/api/migrations/seed/bulk-tag-production-cleanup.sql

# cleanup の全 DELETE が prefix LIKE 句を持つ（無差別 DELETE 防止）
# DELETE 行数 == 'e2e_test_prod_tagbulk_%' を含む行数 であること
test "$(grep -c '^DELETE' apps/api/migrations/seed/bulk-tag-production-cleanup.sql)" \
  = "$(grep -c "e2e_test_prod_tagbulk_%" apps/api/migrations/seed/bulk-tag-production-cleanup.sql)"
```

- AC-2 の直接の機械的担保。staging SQL を不変に保ったまま、production SQL の隔離を保証する。
- cleanup の DELETE は **必ず** `LIKE 'e2e_test_prod_tagbulk_%'` を持つ（prefix なしの全件 DELETE は本番破壊リスクのため許容しない）。

### gate 6: redaction grep gate（bearer 実値の非露出）

runner の evidence（`runtime-tag-bulk-prod-smoke.log` / `summary.json`）に admin bearer / cookie / token の実値が残らないことを保証する。CI 側の既存 attendance smoke job と同一 grep パターンを踏襲。

```bash
# evidence 出力先（例: ci-evidence-bulk-tag-prod/）に bearer 実値の痕跡がないこと
# 実 token 形式（Bearer <jwt> 等）が grep でヒットしないことを確認
! grep -rEi 'Bearer [A-Za-z0-9._-]{20,}' <evidence-dir>
! grep -rEi 'eyJ[A-Za-z0-9._-]+'        <evidence-dir>   # JWT 形式
```

- runner は `redact.sh` でマスク済み出力のみを書き、CI は `::add-mask::` で secret を log マスクする（I-2）。
- local evidence は present。production real D1 evidence は Phase 11 実走時に評価する。

## ファイル削除なし（新規 / 編集のみ）の確認

本タスクの全成果物は新規追加または既存編集であり、**ファイル削除は行わない**。

| 成果物 | 種別 |
| ------ | ---- |
| `scripts/smoke/runtime-tag-bulk.sh` | 編集 |
| `apps/api/migrations/seed/bulk-tag-production-seed.sql` | 新規 |
| `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` | 新規 |
| `.github/workflows/production-runtime-smoke.yml` | 編集（job 追加）|
| `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | 編集（ケース追加）|
| runbook / Phase 11 ledger | 新規 docs |

- staging 資産（`bulk-tag-staging-seed.sql` / `bulk-tag-staging-cleanup.sql` / `assert_staging_guard`）は**削除も変更もしない**。
- 本サイクル後の `git status` で `D`（deleted）エントリが 0 件であることを確認する。

## 完了判定チェックリスト

- [ ] gate 1（local shell test PASS）の実行コマンドと合否基準を定義した
- [ ] gate 2/3（typecheck / lint）を定義した
- [ ] gate 4（actionlint on production-runtime-smoke.yml）を定義した
- [ ] gate 5（SQL prefix grep: production prefix 包含 + staging prefix 非包含 + cleanup 全 DELETE が prefix LIKE）を定義した
- [ ] gate 6（redaction grep: bearer / JWT 実値の非露出）を定義した
- [ ] line budget / link / mirror parity の判定方針を確定した（mirror は symlink 自明 N/A）
- [ ] ファイル削除なし（新規 / 編集のみ・staging 資産不変）を確認する方針を明記した
- [x] redaction gate は local test / actionlint present と production runtime pending の境界を明記した
