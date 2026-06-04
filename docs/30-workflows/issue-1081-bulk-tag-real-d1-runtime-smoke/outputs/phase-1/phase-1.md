# Phase 1: 要件定義 — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

issue #1081「bulk tag real D1 runtime smoke」のスコープ・前提・受入条件・不変条件・依存を固定する。
対象 endpoint `POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`）の実装は issue-1036 で既に landed 済み。
本タスクは **その endpoint が Cloudflare Workers staging + `ubm-hyogo-db-staging` real D1 で contract 通り動く runtime 証跡を自動取得する基盤の新設**に限定する（回帰防止 + 実走自動化 gate）。

> issue #1081 は **CLOSED 状態を維持**する。本仕様書作成では issue state を変更しない。

## 背景

| 構成要素 | 現状 | 根拠 |
| -------- | ---- | ---- |
| endpoint `POST /admin/members/tags/bulk` 実装 | 済（landed） | `apps/api/src/routes/admin/members.ts:726`（issue-1036） |
| local contract / repository test | 全 GREEN（in-memory D1 のみ） | `members-tags-bulk.contract.spec.ts` / `memberTags.bulk.repository.spec.ts` |
| **staging real D1 mutation runtime smoke** | **未取得** | `unassigned-task` に仕様のみ。AC-1〜AC-5 未充足 |
| 既存 runtime smoke が bulk tag をカバー | しない | `runtime-attendance-provider.sh`（attendance）/ `runtime-admin-web.sh`（`/admin` GET）は bulk tag endpoint を叩かない |

→ issue #1081 は未解決の真の gap。別タスクでは解決されていない。本仕様書の作成・実装が必要。

## 真の論点（1文）

> 「staging に bulk tag endpoint が deploy されるたびに、real D1 に対する bulk assign / 再送 no-op / unassign / audit count parity / cleanup が contract 通り成立することを、人手ではなく自動 runner（最終的に CI job）が証跡付きで検証する gate を新設する」。

## issue 本文と実装の乖離（最新コードへ最適化した点）

| # | issue 本文の記述 | 実装の実態（最新コード） | 仕様書での扱い |
| - | ---------------- | ------------------------ | -------------- |
| 1 | bulk assign が `200 + assigned` を返す | `200 + {batchId, results:[{memberId,tagId,status}]}`。status ∈ `assigned`/`noop`/`unassigned`/`skipped_deleted`/`tag_not_found` | runner は `results[].status` を集計検証する |
| 2 | 再送が `200 + noop` | 再送時 `results[].status === "noop"` かつ audit append されない（audit は assigned/unassigned のみ） | AC-2 の冪等性根拠を audit count 不変で明文化 |
| 3 | `mise exec -- pnpm --filter @repo/api ...` | 正パッケージ名は **`@ubm-hyogo/api`**（`@repo/api` は存在しない） | 全コマンドを `@ubm-hyogo/api` に訂正 |
| 4 | audit count query が `target_id LIKE 'e2e_test_issue1036_%'` | 本タスクは prefix を `e2e_test_issue1081_` に固定（親タスクと衝突回避） | seed / cleanup / query / count を `e2e_test_issue1081_` で統一 |

## 実 contract（runner が検証する shape・正本）

```
POST /admin/members/tags/bulk
  body: { memberIds: string[], tagIds: string[], op: "assign" | "unassign" }
  200:  { batchId: string, results: Array<{ memberId, tagId, status }> }
        status ∈ "assigned" | "noop" | "unassigned" | "skipped_deleted" | "tag_not_found"
  audit: status==="assigned"   → admin.member.tag_assigned   (after_json.batchId)
         status==="unassigned" → admin.member.tag_unassigned (before_json.batchId)
         status ∈ {noop, skipped_deleted, tag_not_found} → audit append なし（=冪等性の根拠）
```

- member 解決: `member_identities`（存在）+ `member_status.is_deleted`。is_deleted=1 / 不在 → `skipped_deleted`。
- tag 解決: `tag_definitions.active = 1` に該当なし → `tag_not_found`。

## 受入条件（AC）

| AC | 内容 | 検証方法 |
| -- | ---- | -------- |
| AC-1 | staging の test member / test tag に対する bulk **assign** が `200` + 全 `results[].status === "assigned"` | runner が response を jq 集計し assigned 件数 == memberIds×tagIds を assert |
| AC-2 | 同一 payload の**再送（assign）**が `200` + 全 `results[].status === "noop"`、かつ `admin.member.tag_assigned` の audit count が増えない（冪等性） | retry 前後で audit count query を 2 回実行し差分 0 を assert |
| AC-3 | bulk **unassign** が `200` + 全 `results[].status === "unassigned"`、かつ audit action parity（`tag_assigned` / `tag_unassigned`）が保持される | unassign response の status 集計 + `admin.member.tag_unassigned` audit count 増分を assert |
| AC-4 | smoke 前後の D1 cleanup SQL が記録され、削除対象が **`e2e_test_issue1081_%` データだけに限定**される（他データを巻き込まない） | cleanup SQL の WHERE 句がすべて `LIKE 'e2e_test_issue1081_%'` で限定。cleanup 後の残件 count = 0 を assert |
| AC-5 | command log に endpoint URL / request body の redaction / response summary / audit count query が残る（監査可能） | `runtime-smoke.log` / `summary.json` に上記項目が redact 済みで記録される |
| AC-6 | production 誤実行 guard：`--env staging` 固定。production URL / production env 値が含まれたら runner が `exit 2` で fail する | production guard 関数に production marker を渡すと exit 2（local test で検証） |
| AC-7 | local test（引数 parse / production guard / redaction / contract assertion 関数）が PASS（real D1 接続なし） | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |

## スコープ

### 含む（本サイクルで全成果物を作る・先送りしない / CONST_007）

| # | 成果物 | 種別 |
| - | ------ | ---- |
| 1 | `scripts/smoke/runtime-tag-bulk.sh` | 新規 runner |
| 2 | `apps/api/migrations/seed/bulk-tag-staging-seed.sql` | 新規 seed SQL |
| 3 | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` | 新規 cleanup SQL |
| 4 | `.github/workflows/runtime-smoke-staging.yml` | job 追加（`environment: staging-runtime-smoke`） |
| 5 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | 新規 local test |
| 6 | runbook + Phase 11 evidence ledger | docs |

### 含まない

- 成果物 1〜6 の **コード実装の「実行」**（本 automation-30 改善で同 cycle 実装へ昇格済み）。
- **commit / push / PR 作成**（user-gated）。
- **staging への実 deploy / 実 D1 seed・mutation・cleanup の実走証跡取得**（user-gated。staging real D1 書き込み副作用 + production 誤実行リスクという本質理由による実行タイミング分離。先送り＝別 Issue 化ではない）。
- **production smoke**（本タスクは staging 固定。production への bulk mutation smoke は対象外）。
- **server-side idempotency store の実装（issue #913）**。本タスクの冪等性は「endpoint が再送に対し noop を返し audit append しない」という現状 contract の証跡取得であり、server idempotency key store の新設ではない。
- endpoint / D1 schema / Google Form 仕様の変更（既存 surface のみ叩く）。

## 不変条件

| # | 不変条件 | 本タスクでの遵守 |
| - | -------- | ---------------- |
| I-1 | D1 への直接アクセスは `apps/api` 経由のみ（`apps/web` 禁止・CLAUDE.md 不変条件 #5） | runner は D1 を直接叩かず、HTTP endpoint（`POST /admin/members/tags/bulk`）と `scripts/cf.sh d1 execute`（seed/cleanup/count）経由でのみ操作する |
| I-2 | secret は op 参照 / redact（平文 secret 禁止・CLAUDE.md） | bearer / cookie / token は `redact.sh` でマスク。runner / CI 双方で redaction grep gate を通す。実値は GITHUB_OUTPUT / add-mask のみ |
| I-3 | wrangler は `scripts/cf.sh` 経由（直叩き禁止） | seed / cleanup / audit count query はすべて `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote` 経由 |
| I-4 | production 誤実行禁止 | `--env staging` 固定 + production marker 検出時 exit 2（AC-6）。cleanup/seed は `CLOUDFLARE_ENV=staging` 以外で拒否（既存 seed-issue-399.sh パターン踏襲） |
| I-5 | 既存 API endpoint surface 不変 | 新 endpoint なし。`POST /admin/members/tags/bulk`（既存）のみ叩く |
| I-6 | test fixture は real PII を含まない | seed 行は全て `e2e_test_issue1081_` synthetic prefix。cleanup は同 prefix のみ削除 |

## 依存

| 依存 | 状態 | 関係 |
| ---- | ---- | ---- |
| issue-1036 endpoint（`POST /admin/members/tags/bulk`） | landed 済 | 本 runner が叩く対象。実装変更しない |
| `scripts/cf.sh`（`d1 execute --env staging --remote` ラッパー） | 既存 | seed / cleanup / audit count に再利用 |
| `scripts/smoke/redact.sh` | 既存 | token redaction に再利用 |
| `scripts/smoke/runtime-attendance-provider.sh` | 既存 | runner 構造（`assert_target` / `fail_and_exit` / redact / jq contract）の雛形 |
| `scripts/staging/seed-issue-399.sh` / `cleanup-issue-399.sh` | 既存 | seed/cleanup の `CLOUDFLARE_ENV=staging` guard + count 検証パターンの雛形 |
| `.github/workflows/runtime-smoke-staging.yml`（`environment: staging-runtime-smoke`） | 既存 | job 追加先。承認 gate / secret / redaction grep gate / artifact upload の構造を踏襲 |

## 命名規則（Phase 4 のテスト整合に使用）

| 対象 | 規則 | 例 |
| ---- | ---- | -- |
| smoke runner shell | kebab-case `.sh` | `scripts/smoke/runtime-tag-bulk.sh` |
| shell test | `*.test.sh`（`scripts/smoke/__tests__/`） | `runtime-tag-bulk.test.sh` |
| seed / cleanup SQL | kebab-case `.sql`（`apps/api/migrations/seed/`） | `bulk-tag-staging-seed.sql` |
| CI job 名 | kebab-case | `bulk-tag-runtime-smoke` |
| synthetic prefix | `e2e_test_issue1081_` | `e2e_test_issue1081_mem_1` |

## 完了判定

- [x] スコープ（含む / 含まない）・受入条件 AC-1〜AC-7・不変条件 I-1〜I-6 を固定
- [x] 実 contract（results[].status / audit parity）を Phase 2 設計へ引き継ぎ
- [x] 依存（issue-1036 endpoint landed）と再利用資産を確定
- [x] issue 本文と実装の乖離（@ubm-hyogo/api / results[].status / prefix）を最適化
