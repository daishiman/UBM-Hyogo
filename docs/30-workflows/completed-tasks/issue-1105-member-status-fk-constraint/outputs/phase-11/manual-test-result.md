# 手動テスト結果（NON_VISUAL 証跡記録）

> **[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**
> 本 workflow は local migration + test 追加済み。focused D1 contract test / API typecheck / sequence guard / apps-web diff 0 を実測 PASS として記録する。

## NON_VISUAL 宣言（[WEEKGRD-03] 準拠）

| 項目 | 内容 |
|------|------|
| タスク種別 | `apps/api` D1 schema 変更（`member_status.member_id` への FOREIGN KEY 制約導入 = DB 内部の参照整合性ガード追加） |
| visualEvidence | **NON_VISUAL** |
| 非視覚的理由 | 変更は `apps/api/migrations/` に閉じ、`apps/web` 無変更（diff 0・AC-8）。FK は DB レベルの参照整合性を強制する構造的ガードであり、画面・導線・見た目に一切影響しない。修正前後で UI は同一描画のため、視覚証跡は証跡価値を持たない |
| 代替証跡 | D1 contract test（`apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`）による FK 有効性・既存データ不変・冪等・INDEX 再作成の自動検証。加えて typecheck / lint / `pnpm verify:d1-migrations`（sequence guard）/ `apps/web` diff 0 の grep 検証 |

## メタ情報（[Feedback 4] 準拠）

| 項目 | 値 |
|------|-----|
| タスクID | issue-1105-member-status-fk-constraint |
| issue | [#1105](https://github.com/daishiman/UBM-Hyogo/issues/1105)（**CLOSED**・reopen しない） |
| 証跡の主ソース | **D1 contract test（`apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`）** |
| スクリーンショット | **作成しない**（`screenshots/` ディレクトリ・`.gitkeep` も作らない） |
| スクショ非作成理由 | UI 無変更（`apps/web` diff 0）で修正前後が同一画面になり証跡価値がない。FK は DB 内部の整合性保証であり視覚差分を生まないため（Feedback 4 / WEEKGRD-03） |
| workflow_state | `implemented_local_evidence_captured` |
| 実行環境（予定） | local / `mise exec -- pnpm` / `vitest.d1.config.ts`（in-memory miniflare D1） |

## 1. source-level 検証（spec として AC を test ケースで網羅・[WEEKGRD-01] 準拠 / 製品コード側）

local実装は追加済み。focused D1 contract test を実行し、追加済み test ケースが AC-1〜AC-9 の主要 DB 不変条件を実行的に網羅していることを確認した。

| AC | 主証跡 | 結果 |
|----|----------|------|
| AC-1（FK メタが存在する） | `PRAGMA foreign_key_list(member_status)` が `member_identities` への FK を返す | PASS |
| AC-2（違反 INSERT 拒否） | `PRAGMA foreign_keys = ON` 下で存在しない member を指す INSERT が reject | PASS |
| AC-2/AC-7（正常 INSERT 許容） | 有効 `member_identities` 先行作成 → 同 id の `member_status` INSERT 成功 | PASS |
| AC-3（既存データ不変） | 現行全カラム明示値の before/after が `toEqual` | PASS |
| AC-4（冪等・再適用安全） | `env.db.exec(migrationSql)` を 2 回適用しても行数・カラム値不変 | PASS |
| AC-5（orphan ゼロ前提で migration 成功） | 0025 backfill SQL 再実行後、0026 適用済み schema 上で status 既定行が作成できる | PASS |
| AC-6（PRAGMA 実効性の local 証跡） | in-memory D1 で `PRAGMA foreign_keys = ON` 後の reject を実証。本番 D1 binding は user-gated | PASS / remote pending |
| AC-9（INDEX 再作成） | `idx_member_status_public` が同一定義で再構築後も存在 | PASS |
| AC-8（apps/web diff 0） | `git diff --name-only dev...HEAD \| rg '^apps/web/' \|\| true` | PASS（出力 0 行） |

> AC-1〜AC-9 のすべてに対応する検証手段が Phase 4（test）/ Phase 6,7（回帰・カバレッジ）/ grep（diff 0）に割り当てられており、spec として AC を漏れなく網羅している（Semantic 評価）。

## 2. 実装サイクルで取得予定の証跡（環境・実行カテゴリ・[WEEKGRD-01] 準拠）

「製品コードの検証（source-level の AC 網羅 = §1）」と「実行・環境に依存する証跡取得（本節）」を混在させずに分離記録する。本節の証跡は **実装が landed したlocal実装サイクル**で取得し、本ファイルに present として追記する。

| # | 証跡 | 取得方法 | 現状 |
|---|----------------|----------|------|
| 1 | D1 contract test 全 GREEN | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | PASS（1 file / 6 tests、Duration 21.39s） |
| 2 | apps/api D1 full regression | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --no-file-parallelism --maxWorkers=1 apps/api` | PASS（109 files / 937 tests） |
| 3 | API typecheck PASS | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| 4 | lint 相当（API TS strict） | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS（api package の `lint` と `typecheck` は同一 `tsc -p tsconfig.json --noEmit`） |
| 5 | sequence guard PASS | `mise exec -- pnpm verify:d1-migrations` | PASS（33 migrations、5 documented duplicate prefix group(s)） |
| 6 | `apps/web` diff 0（AC-8） | `git diff --name-only dev...HEAD \| rg '^apps/web/' \|\| true` | PASS（出力 0 行） |
| 7 | D1 binding 上の `PRAGMA foreign_keys` 実効性（AC-6 補完） | staging D1 binding 経由の挙動を runbook に記録 | pending（remote D1・user-gated） |

> in-memory miniflare D1 はデフォルト FK OFF のため、各 FK 検証ケースで `PRAGMA foreign_keys = ON` を明示してから INSERT を試行する（Phase 4 §4.1）。本番 D1 binding の接続単位挙動（AC-6）は remote 操作を要するため user-gated として #6 に分離する。

## 3. 3 層評価（Semantic / Visual / AI UX）

| 層 | 評価 | 根拠 |
|----|------|------|
| Semantic | **PASS** | focused D1 contract test 1 file / 6 tests PASS、apps/api D1 full regression 109 files / 937 tests PASS、API typecheck PASS、sequence guard PASS、apps/web diff 0 |
| Visual | **N/A** | NON_VISUAL（`apps/web` diff 0・UI 無変更で視覚差分なし） |
| AI UX | **N/A** | UI/導線変更なし。ユーザー操作フローに影響しない DB 内部の整合性ガード |

## 4. 仕様判断根拠

- **なぜ NON_VISUAL か**: 変更は FK 付き `member_status` 再構築 migration（`0026`）と D1 contract test に閉じ、`apps/web` 無変更。FK は DB レベルの参照整合性を強制するだけで、UI は従来どおり描画され新しい見た目は生まれない。視覚証跡より `PRAGMA foreign_key_list` メタ・FK 違反 reject・行スナップショット一致の自動検証が適切。
- **なぜスクショを作らないか**: UI 無変更で修正前後が同一画面のため証跡価値がない。空の `screenshots/` も `.gitkeep` も作らない（validate の missing-evidence を誘発しないため）。
- **remote pending の境界**: 本番 / staging D1 binding 上の `PRAGMA foreign_keys` 接続単位挙動確認と remote D1 apply は user-gated。local in-memory D1 では FK reject を実測済み。

## 5. 実装サイクルでの本ファイル更新手順（メモ）

1. 実装（`0026_member_status_fk_constraint.sql` + `0026_member_status_fk_constraint.spec.ts`）を user 承認後に landed。
2. §2 の #1〜#5（vitest / API typecheck / sequence guard / diff 0）は実行済み。
3. §2 の #6（remote D1 binding の `PRAGMA foreign_keys` 実効性・AC-6 補完）は staging 操作を user 承認後に実行し、runbook 記録を追記。
