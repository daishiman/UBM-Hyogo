# issue-1081-bulk-tag-real-d1-runtime-smoke

[実装区分: 実装仕様書]

> **判定根拠（CONST_004）**: issue #1081 が要求するのは「`POST /admin/members/tags/bulk` を Cloudflare Workers staging + real D1 に対して実走させ、bulk assign / retry no-op / unassign / audit count / cleanup の runtime 証跡を取得する」こと。
> この目的の達成には新規 smoke runner script（`scripts/smoke/runtime-tag-bulk.sh`）、staging 用 seed / cleanup SQL fixture、CI workflow への job 追加、local 検証テストの**コード作成**が必須であり、ドキュメント・調査のみでは完結しない。よって CONST_004 のデフォルト（実装仕様書）に該当する。
> 本仕様書は後続実行者が staging smoke を安全に実走できる粒度（変更対象ファイル・関数/SQL 構造・入出力・テスト・実行コマンド・DoD）で記述する（CONST_005）。
> **コード実装は本サイクルで完了**。endpoint 実装自体は既に landed 済（`apps/api/src/routes/admin/members.ts`）で、本タスクでは「その endpoint が staging real D1 で contract 通り動く証跡を自動取得する基盤」を作った。staging real D1 への実 mutation smoke・commit・push・PR のみ user-gated。

## メタ情報

| 項目                | 値                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Task ID             | TASK-ISSUE-1081-BULK-TAG-REAL-D1-RUNTIME-SMOKE-001                                                 |
| Feature 名          | issue-1081-bulk-tag-real-d1-runtime-smoke                                                          |
| Task type           | implementation                                                                                     |
| visualEvidence      | NON_VISUAL（CI / runtime smoke gate 追加。UI 表示物の意匠変更なし）                                |
| implementation_mode | `new`                                                                                             |
| workflow_state      | `implemented_local_evidence_captured`（runner / SQL fixture / CI job / local test 実装済み。staging 実走のみ user-gated） |
| 関連 issue          | #1081（**CLOSED 状態を維持**。本仕様書作成では issue state を変更しない）                            |
| issue alias         | task-issue-1036-followup-005-bulk-tag-real-d1-runtime-smoke                                        |
| 親タスク            | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/`                             |
| 消費した未タスク    | `docs/30-workflows/unassigned-task/task-issue-1036-followup-005-bulk-tag-real-d1-runtime-smoke.md` |
| 対象 endpoint       | `POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`）                          |
| 対象環境            | Cloudflare Workers staging（`api-staging.ubm-hyogo.workers.dev`）+ `ubm-hyogo-db-staging` real D1   |
| 想定 1 cycle 完了   | はい（runner → seed/cleanup SQL → CI job → local test を 1 PR で実装。実走のみ user-gated）          |

## issue #1081 の本質と最新コードへの最適化

### 何が「未解決」か（調査結論）

| 構成要素                                          | 現状                | 根拠                                                                  |
| ------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| endpoint `POST /admin/members/tags/bulk` 実装      | ✅ landed           | `apps/api/src/routes/admin/members.ts`（issue-1036 で実装）            |
| local contract / repository test                   | ✅ 全 GREEN         | `members-tags-bulk.contract.spec.ts`(11) / `memberTags.bulk.repository.spec.ts`(6)。**ただし in-memory D1 のみ** |
| **staging real D1 mutation runtime smoke**         | ❌ **未取得**       | 元 unassigned-task は本 workflow で formalize 済み。runner / fixture / CI job / local test は実装済み、AC-1〜AC-5 の real D1 実走 evidence のみ user-gated   |
| 既存 runtime smoke が bulk tag をカバー            | ❌ しない           | `runtime-attendance-provider.sh`(attendance) / `runtime-admin-web.sh`(`/admin` GET) は bulk tag endpoint を叩かない |

→ **issue #1081 は未解決の真の gap であり、本仕様書の作成・実装が必要**。別タスクでは解決されていない。

### issue 本文と実装の乖離（最新コードへ最適化した点）

| # | issue 本文の記述                              | 実装の実態（最新コード）                                                                 | 仕様書での扱い |
| - | --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------- |
| 1 | bulk assign が `200 + assigned` を返す          | `200 + {batchId, results:[{memberId,tagId,status}]}`。status ∈ `assigned`/`noop`/`unassigned`/`skipped_deleted`/`tag_not_found` | runner は `results[].status` を検証 |
| 2 | 再送が `200 + noop`                            | 再送時 `results[].status === "noop"`（`changed=false`）かつ audit append されない（audit は assigned/unassigned のみ）         | AC-2 の冪等性根拠を明文化 |
| 3 | `mise exec -- pnpm --filter @repo/api ...`     | 正パッケージ名は **`@ubm-hyogo/api`**（`@repo/api` は存在しない）                          | 全コマンドを `@ubm-hyogo/api` に訂正 |
| 4 | audit count query は `target_id LIKE 'e2e_test_issue1036_%'` | 本タスクは prefix を `e2e_test_issue1081_` に固定（親タスクと衝突回避）                    | seed/cleanup/query を `e2e_test_issue1081_` で統一 |

## 設計核心（実装済み local 正本）

### 実 contract（runner が検証する shape）

```
POST /admin/members/tags/bulk
  body: { memberIds: string[], tagIds: string[], op: "assign" | "unassign" }
  200:  { batchId: string, results: Array<{ memberId, tagId, status }> }
        status: "assigned" | "noop" | "unassigned" | "skipped_deleted" | "tag_not_found"
  audit: status==="assigned"   → admin.member.tag_assigned  (after_json.batchId)
         status==="unassigned" → admin.member.tag_unassigned (before_json.batchId)
         status ∈ {noop, skipped_deleted, tag_not_found} → audit append なし（冪等性）
```

### 成果物（本サイクルで全て作成する＝先送りしない / CONST_007）

| # | 成果物                                                       | 種別 | 役割 |
| - | ------------------------------------------------------------ | ---- | ---- |
| 1 | `scripts/smoke/runtime-tag-bulk.sh`                          | 新規 | staging bulk tag mutation smoke runner（seed→assign→retry noop→unassign→audit query→cleanup の orchestration） |
| 2 | `apps/api/migrations/seed/bulk-tag-staging-seed.sql`         | 新規 | `e2e_test_issue1081_*` test member / tag を staging real D1 へ投入 |
| 3 | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql`      | 新規 | `e2e_test_issue1081_%` データを member_tags / members / tag_definitions / audit_log から削除 |
| 4 | `.github/workflows/runtime-smoke-staging.yml`（job 追加）    | 編集 | `environment: staging-runtime-smoke`（user approval gate）で runner を呼ぶ job。既存 GET smoke とは関心分離した独立 job |
| 5 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`          | 新規 | runner の引数 parse / production guard / redaction / contract assertion 関数の local 検証 |
| 6 | runbook（Phase 11 / Phase 12）+ Phase 11 evidence ledger     | docs | 実走手順・evidence 配置・user-gated 境界 |

### user-gated 境界（CONST_007 例外＝先送りではなく副作用ゆえの実行タイミング分離）

- 上記 1〜6 の**成果物作成（コード化）は本サイクルで完了**。
- staging への実 deploy / 実 D1 seed・mutation・cleanup の**実走証跡取得のみ** user 承認後に実行する。これは「staging real D1 への書き込み副作用」「production 誤実行リスク」という本質的理由による（issue のリスク対策にも明記済み）。先送り（別 Issue 化）ではない。

## 正本順位（衝突時の優先度）

1. 実装コード（`apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts`）の実 contract
2. 本ディレクトリ `outputs/phase-{1,2,3}/phase-N.md`（要件・設計・設計レビュー）
3. issue #1081 本文 AC（実装と乖離する箇所は #1〜#4 の最適化を優先）
4. 既存 runtime smoke 資産（`runtime-attendance-provider.sh` / `redact.sh` / `cf.sh` / `scripts/staging/*-issue-399.sh`）のパターン

## Phase 構成

| Phase | 内容 | 主成果物 |
| ----- | ---- | -------- |
| 1 | 要件定義（AC・スコープ・不変条件） | `outputs/phase-1/phase-1.md` |
| 2 | 設計（runner 構造 / SQL / CI job / contract 検証） | `outputs/phase-2/phase-2.md` |
| 3 | 設計レビュー（リスク・正本整合・代替案） | `outputs/phase-3/phase-3.md` |
| 4 | テスト作成（local test ケース設計） | `outputs/phase-4/phase-4.md` |
| 5 | 実装（ファイル別の実装手順・コード骨格） | `outputs/phase-5/phase-5.md` |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` |
| 11 | 手動テスト（API smoke evidence・runtime ledger） | `outputs/phase-11/phase-11.md` + `manual-test-result.md` |
| 12 | ドキュメント更新（strict 7） | `outputs/phase-12/*` |
| 13 | PR 作成（user-gated） | `outputs/phase-13/phase-13.md` |
