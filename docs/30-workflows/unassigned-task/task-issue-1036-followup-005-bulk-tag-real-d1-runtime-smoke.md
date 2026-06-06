# Issue #1036 follow-up 005: bulk tag real D1 runtime smoke

## メタ情報

```yaml
issue_number: 1081
task_id: task-issue-1036-followup-005-bulk-tag-real-d1-runtime-smoke
task_name: bulk tag endpoint の real D1 / staging runtime smoke 証跡取得
category: 改善
target_feature: apps/api POST /admin/members/tags/bulk
priority: 中
scale: 小規模
status: formalized_consumed_local_implementation_done
source_phase: issue-1036-bulk-member-tag-assign runtime evidence boundary
created_date: 2026-06-01
resolved_date: 2026-06-03
dependencies: [issue-1036-bulk-member-tag-assign]
```

| 項目 | 内容 |
| --- | --- |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 実装ガイド | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md` |
| 分類 | follow-up / runtime evidence |
| 優先度 | 中 |
| 解決先 workflow | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/` |
| 解決状態 | runner / seed-cleanup SQL / CI job / local stub test は実装済み。staging real D1 mutation smoke 実走のみ user-gated |

> **消費済み trace**: 本未タスクは `issue-1081-bulk-tag-real-d1-runtime-smoke` として Phase 1-13 化され、local implementation は完了した。削除せず起票元 trace として残すが、active 未実施タスクではない。

## 1. 概要

Issue #1036 は local D1 setup による contract / repository tests で `POST /admin/members/tags/bulk` の AC を証明した。一方、Cloudflare Workers staging と real D1 に対する read/write smoke は user-gated として残っている。本タスクは staging 専用 test member / test tag を使い、bulk assign / retry no-op / unassign / audit count を実環境で確認する。

## 2. 目的

- staging Workers runtime + real D1 で bulk tag endpoint が contract 通り動くことを確認する。
- DB 自然冪等（再送時 noop + audit 増加なし）が real D1 でも成立することを確認する。
- smoke data の投入・cleanup を安全に実行し、本番データへ影響させない。

## 3. 受け入れ基準

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | staging 専用 test member / test tag で bulk assign が 200 + `assigned` を返す |
| AC-2 | 同一 payload 再送が 200 + `noop` を返し、audit count が増えない |
| AC-3 | bulk unassign が 200 + `unassigned` を返し、audit action parity が保たれる |
| AC-4 | smoke 前後の D1 cleanup SQL が記録され、`e2e_test_*` データだけに限定される |
| AC-5 | command log に endpoint URL、request body redaction、response summary、audit count query が残る |

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260601-060807-wt-11/apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts`
- 症状: 現行 contract spec は in-memory D1 setup で route contract を十分に固定しているが、staging Workers runtime では admin auth header、real D1 の migration 状態、seed data、Cloudflare request body handling が絡む。実 D1 に test data を入れるため、read-only evidence と mutation smoke の承認境界を分ける必要がある。
- 参照: `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`, `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/phase-11-manual-test.md`

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| staging D1 に残データを作る | 中 | `e2e_test_issue1036_*` prefix を固定し、cleanup SQL を smoke の最後に必ず実行する |
| production D1 に誤実行する | 高 | command は `--env staging` と staging URL を固定し、production URL / env が含まれたら script が fail する guard を入れる |
| admin auth token をログへ出す | 高 | request log は token/body secret を redact し、header value は出力しない |
| audit count の query が広すぎる | 中 | `target_id LIKE 'e2e_test_issue1036_%'` と action / batchId で限定する |
| mutation smoke がユーザー承認なしに走る | 高 | D1 seed / endpoint POST / cleanup は user approval marker 後のみ実行する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @repo/api test --run src/routes/admin/members-tags-bulk.contract.spec.ts src/repository/__tests__/memberTags.bulk.repository.spec.ts
```

期待: local D1 contract / repository tests が PASS。

### 統合検証

```bash
# user approval 後のみ実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --command "<seed e2e_test_issue1036 rows>"
curl -sS -X POST "https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/members/tags/bulk" \
  -H "Authorization: Bearer <redacted>" \
  -H "content-type: application/json" \
  --data '{"memberIds":["e2e_test_issue1036_m1"],"tagIds":["e2e_test_issue1036_tag"],"op":"assign"}'
```

期待: assign / retry noop / unassign / audit count / cleanup の各ログが保存される。`<redacted>` はログに実値を残さない。

## スコープ

### 含む

- staging real D1 用 smoke 手順または script
- seed / assign / retry / unassign / audit query / cleanup evidence
- Phase 11 / Phase 12 runtime evidence ledger の更新

### 含まない

- production runtime smoke
- Issue #1036 本体 endpoint の設計変更
- server idempotency store (#913) の実装
- commit / push / PR 作成

## 参照

- `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-12/implementation-guide.md`
- `apps/api/src/routes/admin/members-tags-bulk.contract.spec.ts`
- `apps/api/src/repository/__tests__/memberTags.bulk.repository.spec.ts`
