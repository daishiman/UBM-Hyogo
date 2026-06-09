# issue-1137-bulk-tag-production-runtime-smoke

[実装区分: 実装仕様書]

> **判定根拠（CONST_004）**: issue #1137 が要求するのは「issue-1081 が確立した staging bulk tag mutation runtime smoke を、production Workers（`ubm-hyogo-api`）+ production real D1（`ubm-hyogo-db-prod`）に対する mutation smoke へ拡張する」こと。
> この目的の達成には、既存 staging runner（`scripts/smoke/runtime-tag-bulk.sh`）への production 経路追加（別 guard 関数 + 二重承認 gate）、production 専用 seed / cleanup SQL fixture、production 専用 CI job（`workflow_dispatch` 限定）、local 検証テストの拡張という**コード作成**が必須であり、ドキュメント・調査のみでは完結しない。よって CONST_004 のデフォルト（実装仕様書）に該当する。
> 本仕様書は後続実行者が production smoke を安全に実走できる粒度（変更対象ファイル・関数/SQL 構造・入出力・テスト・実行コマンド・DoD）で記述する（CONST_005）。
> **本サイクルの実装区分は `implemented_local_runtime_pending`**。runner / SQL / production CI job / local shell test を本サイクルで実装し、production real D1 への実走証跡取得のみ user 二重承認後に分離する。

## メタ情報

| 項目                | 値                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Task ID             | TASK-ISSUE-1137-BULK-TAG-PRODUCTION-RUNTIME-SMOKE-001                                                        |
| Feature 名          | issue-1137-bulk-tag-production-runtime-smoke                                                                 |
| Task type           | implementation                                                                                               |
| visualEvidence      | NON_VISUAL（CI / runtime smoke gate 拡張。UI 表示物の意匠変更なし）                                          |
| implementation_mode | `new`（production 経路 / SQL / CI job / test 拡張は新規。endpoint は既 landed で不変）                       |
| workflow_state      | `implemented_local_runtime_pending`（runner・SQL・CI job・local test は実装済み。production real D1 実走のみ user-gated）                              |
| 関連 issue          | #1137（**CLOSED 状態を維持**。本仕様書作成では issue state を変更しない）                                     |
| issue alias         | task-issue-1036-followup-006-bulk-tag-production-runtime-smoke                                               |
| 親タスク（staging） | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（staging runtime smoke 基盤・実装済み）       |
| 親タスク（endpoint）| `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/`（endpoint landed・不変）              |
| 消費した未タスク    | `docs/30-workflows/unassigned-task/task-issue-1036-followup-006-bulk-tag-production-runtime-smoke.md`        |
| 対象 endpoint       | `POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`・**変更しない**）                    |
| 対象環境            | Cloudflare Workers production（`ubm-hyogo-api` / `https://api.ubm-hyogo.workers.dev`）+ `ubm-hyogo-db-prod` real D1 |
| 想定 1 cycle 完了   | はい（runner 拡張 → production seed/cleanup SQL → production CI job → local test 拡張を 1 PR で実装。実走のみ user-gated） |

## issue #1137 の本質と最新コードへの最適化

### 何が「未解決」か（調査結論）

| 構成要素                                                       | 現状                | 根拠                                                                                       |
| ------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| endpoint `POST /admin/members/tags/bulk` 実装                  | ✅ landed・不変      | `apps/api/src/routes/admin/members.ts`（issue-1036）。status enum も現行コードと一致         |
| **staging** bulk tag mutation runtime smoke                   | ✅ 実装済み          | `scripts/smoke/runtime-tag-bulk.sh`（issue-1081）。`--env staging` 固定・`assert_staging_guard` で production 拒否 |
| **production** bulk tag mutation runtime smoke                | ✅ local 実装済み / runtime pending | `scripts/smoke/runtime-tag-bulk.sh` が `staging|production` を受理。production は別 guard / prod D1 / prod prefix / dual marker を要求 |
| production 用 seed / cleanup SQL（synthetic prefix 分離）       | ✅ local 実装済み    | `apps/api/migrations/seed/bulk-tag-production-{seed,cleanup}.sql` を追加。`e2e_test_prod_tagbulk_%` のみ対象 |
| production smoke CI job（`workflow_dispatch` 限定 + 承認 gate） | ✅ local 実装済み    | `production-runtime-smoke.yml` に `bulk-tag-production-runtime-smoke` job を追加。environment 承認 + runner dual marker + redaction gate |
| 既存 production GET smoke が bulk tag mutation をカバー         | ❌ しない           | `runtime-admin-web.sh`（#922・`/admin` GET）/ `runtime-attendance-provider.sh`（attendance）は bulk tag endpoint を叩かない |

→ **issue #1137 は未解決の真の gap であり、別タスクでは解決されていない**。本仕様書の作成・実装が必要。

### issue 本文と最新コードの乖離（最適化した点）

| # | issue 本文の記述                                                            | 最新コードの実態                                                                            | 仕様書での扱い                                                  |
| - | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1 | 苦戦箇所が `…/task-20260603-180735-wt-10/scripts/smoke/runtime-tag-bulk.sh` を参照 | 当該パスは旧 worktree（既に消滅）。正本は repo 相対 `scripts/smoke/runtime-tag-bulk.sh`     | 全参照を repo 相対パスへ正規化                                  |
| 2 | `assert_staging_guard`（runtime-tag-bulk.sh:122-）が staging 固定 guard       | 現行コードでも `assert_staging_guard` は line 122、`parse_args` の staging 固定は line 71-74 | 行番号・関数名とも現行確認済み。staging guard は逐語不変で温存（AC-6） |
| 3 | response を `assigned`/`noop`/`unassigned` 単値として記述                     | 実 contract は `200 + {batchId, results:[{memberId,tagId,status}]}`、status ∈ `assigned`/`noop`/`unassigned`/`skipped_deleted`/`tag_not_found` | runner は `results[].status` を集計検証（staging runner と同一方針） |
| 4 | パッケージ名 `@repo/api`                                                     | 正パッケージ名は **`@ubm-hyogo/api`**（`@repo/api` は存在しない）                            | 全コマンドを `@ubm-hyogo/api` に訂正                            |
| 5 | 「production 用 runner 拡張 **or** 派生」と二択提示                           | 先行事例 #922 `runtime-admin-web.sh` は単一 runner を `staging\|production` env 分岐で拡張   | **単一 runner 拡張 + 別 guard 関数** を採用（#922 踏襲・重複排除・staging guard 逐語不変）。followup-007 共通 lib 抽出には依存しない |

## 設計核心（本仕様書が固定する production 経路）

### 実 contract（runner が検証する shape・正本）

```
POST /admin/members/tags/bulk                       （endpoint は不変。production でも同一 contract）
  body: { memberIds: string[], tagIds: string[], op: "assign" | "unassign" }
  200:  { batchId: string, results: Array<{ memberId, tagId, status }> }
        status ∈ "assigned" | "noop" | "unassigned" | "skipped_deleted" | "tag_not_found"
  audit: status==="assigned"   → admin.member.tag_assigned   (after_json.batchId)
         status==="unassigned" → admin.member.tag_unassigned (before_json.batchId)
         status ∈ {noop, skipped_deleted, tag_not_found} → audit append なし（=冪等性の根拠）
```

### production 経路の安全設計（staging との桁違いの厳格さ）

| 項目              | staging（既存・不変）                              | production（本タスクで新設）                                          |
| ----------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| 許可 env          | `staging` のみ                                     | `production` を追加受理（staging 受理も維持）                         |
| guard 関数        | `assert_staging_guard`（逐語不変）                 | `assert_production_guard`（新設・別関数）                             |
| allowlist regex   | `staging\|127.0.0.1\|localhost`                   | `^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev\|api\.ubm-hyogo\.workers\.dev)$`（URL host 限定・production 独立評価） |
| D1 database       | `ubm-hyogo-db-staging`                             | `ubm-hyogo-db-prod`                                                  |
| fixture prefix    | `e2e_test_issue1081_`                             | `e2e_test_prod_tagbulk_`（staging と完全分離）                       |
| 承認              | `environment: staging-runtime-smoke`（1 段）       | `environment: production-runtime-smoke`（GitHub 承認）+ runner 内 dual marker（2 段） |
| CI トリガ         | auto（deploy 後）+ approval                        | `workflow_dispatch` 限定（auto trigger 不可）                        |
| cleanup 残件      | 残件 0 assert                                      | 残件 0 assert（残件あれば FAIL・本番露出/audit 汚染防止）            |

### 成果物（本サイクルで全て仕様化する＝先送りしない / CONST_007）

| # | 成果物                                                          | 種別 | 役割                                                                                       |
| - | -------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| 1 | `scripts/smoke/runtime-tag-bulk.sh`                            | 編集 | `production` env 受理 + `assert_production_guard` + dual approval marker + env 別 prefix/SQL/D1/allowlist 分岐。`assert_staging_guard` は逐語不変 |
| 2 | `apps/api/migrations/seed/bulk-tag-production-seed.sql`        | 新規 | `e2e_test_prod_tagbulk_*` test member / tag を production real D1 へ投入                     |
| 3 | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql`     | 新規 | `e2e_test_prod_tagbulk_%` データを member_tags / member_status / member_identities / member_responses / tag_definitions / audit_log から削除 |
| 4 | `.github/workflows/production-runtime-smoke.yml`（job 追加）   | 編集 | `bulk-tag-production-runtime-smoke` job。`workflow_dispatch` 限定 + `environment: production-runtime-smoke` 承認 + secret 検証 + redaction grep gate + artifact upload |
| 5 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`            | 編集 | production guard / dual marker / production allowlist / staging guard 非退化（AC-6）の local 検証ケース追加 |
| 6 | runbook（Phase 11 / Phase 12）+ Phase 11 evidence ledger       | docs | 実走手順・evidence 配置・二重承認・user-gated 境界                                          |

### user-gated 境界（CONST_007 例外＝先送りではなく副作用ゆえの実行タイミング分離）

- 上記 1〜6 の**成果物作成（コード化）は本サイクルで完了**した。
- production への実 deploy / 実 D1 seed・mutation・cleanup の**実走証跡取得**は user 二重承認後にのみ実行する。これは「production real D1 への書き込み副作用が本番会員データ・公開面・audit に及ぶ」「production 誤実行リスク」という本質的理由による実行タイミング分離であり、先送り（別 Issue 化）ではない。

## 正本順位（衝突時の優先度）

1. 実装コード（`apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts` / 既存 `scripts/smoke/runtime-tag-bulk.sh`）の実 contract・実 guard
2. 本ディレクトリ `outputs/phase-{1,2,3}/phase-N.md`（要件・設計・設計レビュー）
3. issue #1137 本文 AC（実装と乖離する箇所は #1〜#5 の最適化を優先）
4. 先行事例 #922 `runtime-admin-web.sh`（production env 分岐パターン）/ `production-runtime-smoke.yml`（workflow_dispatch + environment 承認パターン）

## Phase 構成

| Phase | 内容 | 主成果物 |
| ----- | ---- | -------- |
| 1 | 要件定義（AC・スコープ・不変条件） | `outputs/phase-1/phase-1.md` |
| 2 | 設計（runner 分岐 / production guard / SQL / CI job / contract 検証） | `outputs/phase-2/phase-2.md` |
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
