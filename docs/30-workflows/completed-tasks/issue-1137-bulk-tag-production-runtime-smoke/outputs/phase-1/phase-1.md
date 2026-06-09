# Phase 1: 要件定義 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

issue #1137「bulk tag endpoint の production runtime smoke 拡張」のスコープ・前提・受入条件・不変条件・依存を固定する。
対象 endpoint `POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`）の実装は issue-1036 で landed 済み・**変更しない**。staging runtime smoke 基盤（`scripts/smoke/runtime-tag-bulk.sh`）は issue-1081 で実装済み。
本タスクは **その staging smoke 基盤を、production Workers（`ubm-hyogo-api`）+ `ubm-hyogo-db-prod` real D1 に対する mutation smoke へ拡張する**ことに限定する。staging guard は逐語不変で温存し、production 経路は別 guard 関数 + 二重承認 gate として共存させる。

> issue #1137 は **CLOSED 状態を維持**する。本仕様書作成では issue state を変更しない。
> 本サイクルの実装区分は `implemented_local_runtime_pending`（runner・SQL・CI job・local test 実装済み。production real D1 実走のみ user-gated）。

## 背景

| 構成要素 | 現状 | 根拠 |
| -------- | ---- | ---- |
| endpoint `POST /admin/members/tags/bulk` 実装 | 済（landed・不変） | `apps/api/src/routes/admin/members.ts`（issue-1036）。status enum `assigned`/`noop`/`unassigned`/`skipped_deleted`/`tag_not_found` を `members-tags-bulk.contract.spec.ts` で確認 |
| **staging** bulk tag mutation runtime smoke | 実装済み | `scripts/smoke/runtime-tag-bulk.sh`（issue-1081）。`--env staging` 固定・`assert_staging_guard`（line 122-）で production 拒否 |
| **production** bulk tag mutation runtime smoke | **local 実装済み / runtime pending** | `runtime-tag-bulk.sh` が `production` を受理し、prod D1 / prod prefix / dual marker guard を要求 |
| 既存 production smoke が bulk tag mutation をカバー | しない | `runtime-admin-web.sh`（#922・`/admin` GET）/ `runtime-attendance-provider.sh`（attendance）は bulk tag endpoint を叩かない |

→ issue #1137 は未解決の真の gap。別タスクでは解決されていない。本仕様書の作成・実装が必要。

## 真の論点（1文）

> 「production に bulk tag endpoint が deploy されたとき、production real D1 に対する bulk assign / 再送 no-op / unassign / audit count parity / cleanup 残件 0 が contract 通り成立することを、本番会員データ・公開面・audit を一切汚染せず、二重承認 gate 越しにのみ、証跡付きで検証できる runtime 経路を新設する」。

## issue 本文と最新コードの乖離（最適化した点）

| # | issue 本文の記述 | 最新コードの実態 | 仕様書での扱い |
| - | ---------------- | ---------------- | -------------- |
| 1 | 苦戦箇所が `…/task-20260603-180735-wt-10/scripts/smoke/runtime-tag-bulk.sh` を参照 | 当該 worktree は消滅。正本は repo 相対 `scripts/smoke/runtime-tag-bulk.sh` | 全参照を repo 相対パスへ正規化 |
| 2 | `assert_staging_guard`（runtime-tag-bulk.sh:122-） | 現行でも line 122、staging 固定は line 71-74 | 行番号・関数名とも現行確認済。staging guard は逐語不変で温存（AC-6） |
| 3 | response を `assigned`/`noop`/`unassigned` 単値で記述 | `200 + {batchId, results:[{memberId,tagId,status}]}`、status ∈ 5 値 | runner は `results[].status` を集計検証 |
| 4 | パッケージ名 `@repo/api` | 正パッケージ名は **`@ubm-hyogo/api`** | 全コマンドを `@ubm-hyogo/api` に訂正 |
| 5 | runner「拡張 **or** 派生」二択 | 先行事例 #922 は単一 runner を env 分岐で拡張 | **単一 runner 拡張 + 別 guard 関数** を採用（重複排除・staging guard 逐語不変・followup-007 共通 lib 抽出に非依存） |

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

## production 環境定数（wrangler.toml 確認済み）

| 定数 | 値 | 出典 |
| ---- | -- | ---- |
| production API worker 名 | `ubm-hyogo-api` | `apps/api/wrangler.toml:49`（`[env.production] name`） |
| production API URL | `https://api.ubm-hyogo.workers.dev` | `apps/api/wrangler.toml:58,60`（AUTH_URL / API_INTERNAL_BASE_URL） |
| production D1 名 | `ubm-hyogo-db-prod` | `apps/api/wrangler.toml:21,95` |
| production allowlist regex | `^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$` | 本タスクで新設（URL host 限定・staging allowlist と独立評価） |
| production fixture prefix | `e2e_test_prod_tagbulk_` | 本タスクで新設（staging `e2e_test_issue1081_` と完全分離） |

## 受入条件（AC）

| AC | 内容 | 検証方法 |
| -- | ---- | -------- |
| AC-1 | production 専用 allowlist host regex を導入し、production endpoint（`ubm-hyogo-api.*.workers.dev` / `https://api.ubm-hyogo.workers.dev`）にだけマッチする。staging allowlist とは独立して評価する | `assert_production_guard` が URL host を抽出し、`PRODUCTION_API_HOST_ALLOW_REGEX` に一致しない host を `exit 2`。local test で staging URL / 任意 URL / path 部分一致 URL を渡すと refuse する |
| AC-2 | production 専用 fixture prefix `e2e_test_prod_tagbulk_` を staging の `e2e_test_issue1081_` と分離して固定し、production smoke は当該 prefix のデータにのみ作用する | production seed/cleanup SQL の全 INSERT/DELETE が `e2e_test_prod_tagbulk_` を使用。staging prefix を含まないことを grep gate で確認 |
| AC-3 | production smoke は二重承認 gate（明示 approval marker × 2、CI 自動実行不可）後のみ seed / POST / cleanup を実行する | `assert_production_guard` が 2 つの承認 env（`BULK_TAG_PRODUCTION_SMOKE_APPROVAL` / `BULK_TAG_PRODUCTION_SMOKE_CONFIRM`）の双方が正値でない限り `exit 2`。CI 側は `workflow_dispatch` 限定 + `environment: production-runtime-smoke` 承認。auto trigger を持たない |
| AC-4 | smoke 終了時に cleanup 残件 0 を assert する（`e2e_test_prod_tagbulk_` の member_tags / member_status / member_identities / member_responses / tag_definitions / audit_log 行が残らないことをクエリで確認）。残件があれば FAIL | cleanup 後に各 table を `count(*) WHERE col LIKE 'e2e_test_prod_tagbulk_%'` で集計し、すべて 0 でなければ `fail_and_exit` |
| AC-5 | production smoke の audit parity を確認する（assign / unassign の action / batchId / count が contract 通りで、production audit に test 行が残留しない） | assign 後 `admin.member.tag_assigned` count、retry 後不変（冪等）、unassign 後 `admin.member.tag_unassigned` count 増分を assert。cleanup 後 audit 残件 0（AC-4 に含む） |
| AC-6 | 既存 staging runner の `assert_staging_guard`（`--env staging` 固定 / production marker・`ubm-hyogo-db-staging` 名不一致時 exit 2）が非退化であることを既存 local test の PASS で確認する | `assert_staging_guard` 関数本体を逐語変更しない。既存 local test ケース（production-env-refused / production-url-refused / d1-database-refused 等）が引き続き PASS |
| AC-7 | command log に production endpoint URL、request body redaction、response summary、audit count query、cleanup query が残り、bearer / token 実値は redact される | `runtime-tag-bulk-prod-smoke.log` / `summary.json` に上記が `redact.sh` でマスク済みで記録される。CI 側 redaction grep gate を通す |
| AC-8 | issue 本文 contract（assigned 単値 / `@repo/api`）を最新コード（`results[].status` / `@ubm-hyogo/api`）へ最適化する | runner は `results[].status` を jq 集計検証。全ドキュメント/コマンドのパッケージ名は `@ubm-hyogo/api` |

## スコープ

### 含む（本サイクルで全成果物を仕様化する・先送りしない / CONST_007）

| # | 成果物 | 種別 |
| - | ------ | ---- |
| 1 | `scripts/smoke/runtime-tag-bulk.sh`（production env 受理 + `assert_production_guard` + dual marker + env 別 prefix/SQL/D1/allowlist） | 編集 |
| 2 | `apps/api/migrations/seed/bulk-tag-production-seed.sql` | 新規 seed SQL |
| 3 | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` | 新規 cleanup SQL |
| 4 | `.github/workflows/production-runtime-smoke.yml`（`bulk-tag-production-runtime-smoke` job 追加） | 編集 |
| 5 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（production guard / dual marker / allowlist / staging 非退化テスト追加） | 編集 |
| 6 | runbook + Phase 11 evidence ledger | docs |

### 含まない

- 成果物 1〜6 の **コード実装と local 検証**（本サイクルで完了）。
- **commit / push / PR 作成**（user-gated・Gate-C）。
- **production への実 deploy / 実 D1 seed・mutation・cleanup の実走証跡取得**（user 二重承認 gate 後・Gate-B。本番会員データへの書き込み副作用 + production 誤実行リスクという本質理由による実行タイミング分離。先送り＝別 Issue 化ではない）。
- **staging runner の設計変更**（issue-1081 本体）。`assert_staging_guard` は逐語不変。staging seed/cleanup SQL も不変。
- **`POST /admin/members/tags/bulk` endpoint 本体の設計変更**（issue-1036 で landed 済）。
- **smoke runner 共通 lib 抽出**（followup-007 = 別 unassigned task）。本タスクは共通 lib に依存せず、単一 runner 内の env 分岐で実装する。
- **server-side idempotency store の実装（issue #913）**。本タスクの冪等性は「再送に対し noop を返し audit append しない」現状 contract の証跡取得。
- endpoint / D1 schema / Google Form 仕様の変更（既存 surface のみ叩く）。

## 不変条件

| # | 不変条件 | 本タスクでの遵守 |
| - | -------- | ---------------- |
| I-1 | D1 への直接アクセスは `apps/api` 経由のみ（`apps/web` 禁止・CLAUDE.md 不変条件 #5） | runner は D1 を直接叩かず、HTTP endpoint（`POST /admin/members/tags/bulk`）と `scripts/cf.sh d1 execute`（seed/cleanup/count）経由でのみ操作する |
| I-2 | secret は op 参照 / redact（平文 secret 禁止・CLAUDE.md） | bearer / cookie / token は `redact.sh` でマスク。runner / CI 双方で redaction grep gate を通す。実値は `::add-mask::` のみ |
| I-3 | wrangler は `scripts/cf.sh` 経由（直叩き禁止） | seed / cleanup / audit count query はすべて `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote` 経由 |
| I-4 | production 誤実行禁止 | `assert_production_guard` が production allowlist regex + 二重承認 marker（双方）+ `CF_D1_DATABASE == ubm-hyogo-db-prod` を要求。いずれか欠落で `exit 2`。staging guard は別経路で温存 |
| I-5 | 既存 API endpoint surface 不変 | 新 endpoint なし。`POST /admin/members/tags/bulk`（既存）のみ叩く |
| I-6 | test fixture は real PII を含まない | seed 行は全て `e2e_test_prod_tagbulk_` synthetic prefix。cleanup は同 prefix のみ削除。残件 0 を smoke 終了条件にする（AC-4） |
| I-7 | staging smoke の安全性を退化させない | `assert_staging_guard` を逐語変更しない。production 経路は別 guard 関数で完全分離（AC-6） |

## 依存

| 依存 | 状態 | 関係 |
| ---- | ---- | ---- |
| issue-1036 endpoint（`POST /admin/members/tags/bulk`） | landed 済 | 本 runner が叩く対象。実装変更しない |
| issue-1081 staging runner（`scripts/smoke/runtime-tag-bulk.sh`） | landed 済 | 本タスクの拡張対象。orchestration（seed→assign→retry noop→unassign→audit→cleanup）を再利用 |
| `scripts/cf.sh`（`d1 execute --env production --remote` ラッパー） | 既存 | seed / cleanup / audit count に再利用 |
| `scripts/smoke/redact.sh` | 既存 | token redaction に再利用 |
| `scripts/smoke/runtime-admin-web.sh`（#922） | 既存 | production env 分岐 / 環境別 allowlist regex のパターン雛形 |
| `.github/workflows/production-runtime-smoke.yml` | 既存 | job 追加先。`workflow_dispatch` 限定 / `environment: production-runtime-smoke` 承認 / secret 検証 / redaction grep gate / artifact upload の構造を踏襲 |
| followup-007（smoke runner 共通 lib 抽出） | 別 unassigned task | **依存しない**。本タスクは単一 runner 内の env 分岐で実装。共通 lib 抽出は将来の独立タスク |

## 命名規則（Phase 4 のテスト整合に使用）

| 対象 | 規則 | 例 |
| ---- | ---- | -- |
| smoke runner shell | kebab-case `.sh`（既存を編集） | `scripts/smoke/runtime-tag-bulk.sh` |
| shell test | `*.test.sh`（`scripts/smoke/__tests__/`・既存を編集） | `runtime-tag-bulk.test.sh` |
| production seed / cleanup SQL | kebab-case `.sql`（`apps/api/migrations/seed/`） | `bulk-tag-production-seed.sql` / `bulk-tag-production-cleanup.sql` |
| production CI job 名 | kebab-case | `bulk-tag-production-runtime-smoke` |
| production guard 関数 | snake_case | `assert_production_guard` |
| production synthetic prefix | `e2e_test_prod_tagbulk_` | `e2e_test_prod_tagbulk_mem_1` |
| 承認 marker env | UPPER_SNAKE | `BULK_TAG_PRODUCTION_SMOKE_APPROVAL` / `BULK_TAG_PRODUCTION_SMOKE_CONFIRM` |

## 完了判定

- [x] スコープ（含む / 含まない）・受入条件 AC-1〜AC-8・不変条件 I-1〜I-7 を固定
- [x] 実 contract（results[].status / audit parity）と production 環境定数（`ubm-hyogo-db-prod` / `ubm-hyogo-api`）を Phase 2 設計へ引き継ぎ
- [x] 依存（issue-1036 endpoint landed / issue-1081 staging runner landed）と再利用資産、followup-007 非依存を確定
- [x] issue 本文と最新コードの乖離（旧 worktree path / @ubm-hyogo/api / results[].status / runner 拡張方針）を最適化
