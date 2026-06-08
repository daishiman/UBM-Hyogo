# issue-1105 — member_status.member_id への FK 制約導入

> **実装区分: 実装仕様書（NON_VISUAL / implementation_mode: new）**
> issue #1105 の既定ラベルは type:improvement（DB schema 変更）。root cause（DB レベルの参照整合性ガード不在 = orphan を構造的に禁止できない）の解消にはコード変更（FK 付き `member_status` 再構築 migration + 有効性テスト）が必須のため、CONST_004 に従い**実装仕様書**として作成する（docs-only ではない）。

| 項目 | 値 |
|------|-----|
| task_id | `issue-1105-member-status-fk-constraint` |
| issue | [#1105](https://github.com/daishiman/UBM-Hyogo/issues/1105)（**CLOSED**・reopen しない） |
| status | `implemented_local_evidence_captured`（local実装済み。remote D1 apply / commit / PR は user-gated） |
| 区分 | 実装仕様書 / NON_VISUAL / new |
| branch | `docs/issue-1105-member-status-fk-constraint-spec` |
| source unassigned-task | `docs/30-workflows/completed-tasks/unassigned-task/admin-member-detail-status-404-fix-followup-002-member-status-fk-constraint.md` |
| 親 workflow | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` |
| 対象領域 | `apps/api`（D1 migration / migration contract test / FK 前提に追従する既存 D1 test fixtures）。`apps/web` diff 0 |

---

## 0. 調査結論（他タスクでの解決有無 / issue 陳腐化の最適化）

### 0.1 実行要否の判定 → **実行が必要（未実装）**

現行コードベースを調査し、FK 制約は**他タスクで一切実装されていない**ことを確認した。

| 調査項目 | 結果 |
|---------|------|
| `member_status` の FK 制約 | baseline は **不在**。本サイクルで `0026_member_status_fk_constraint.sql` を追加 |
| `FOREIGN KEY` / `REFERENCES`（migrations 全体） | **0 件**（`grep -rn "FOREIGN KEY\|REFERENCES" apps/api/migrations/*.sql`） |
| `member_status_new`（再構築パターン） | **0 件** |
| `PRAGMA foreign_keys`（apps/api 全体） | **0 件** |
| backfill / `ensureMemberStatusRow`（親タスク止血） | 適用済み（`0025_backfill_member_status.sql` / `apps/api/src/repository/status.ts`）。本サイクルで FK 制約を追加 |

→ 親タスクの止血（backfill + `ensureMemberStatusRow`）は landed 済みだが、**DB レベルで orphan を構造的に禁止する FK 制約は未導入**。本タスクの実行は必要。

### 0.2 issue 陳腐化 → 現行コードへの最適化（3 点）

| # | issue body の記述（陳腐化） | 現行コード（最適化後） |
|---|----------------------------|----------------------|
| 1 | backfill = `0024_backfill_member_status.sql` | **`0025_backfill_member_status.sql`**（0024 prefix は `0024_member_photos_variants.sql` が占有）。新 FK migration は **`0026_member_status_fk_constraint.sql`** |
| 2 | （言及なし） | **FK 前例ゼロ**: migrations 全体に `FOREIGN KEY` 皆無・`PRAGMA foreign_keys` 皆無 → FK 導入は本リポジトリ初の構造パターン。D1 上の PRAGMA 実効性検証（AC-6）の必要性が補強される |
| 3 | §5.2 NOTE「INDEX/VIEW 棚卸し」（抽象記述） | **具体化**: `idx_member_status_public`（`0002` L81-82）が再構築（DROP/RENAME）で消失するため、FK migration 末尾で**同一定義の INDEX 再作成が必須**（AC-9 として明文化） |
| 4 | （言及なし） | `0020_notification_channel_and_opt_out.sql` で追加済みの `notification_opt_out` を現行カラムとして保持 |

> issue #1105 は CLOSED のまま。本仕様書は reopen せず、現行コードへ再スコープして作成する。

---

## 1. なぜ必要か（Why）

`member_status.member_id` は `member_identities(member_id)`（PRIMARY KEY）を指す関係だが、FK 制約が宣言されていない。アプリ層のバグや ingest 経路の漏れがあれば、`member_status` の無い orphan、または存在しない `member_identities` を指す `member_status` 行が DB 上許容される。親タスクが backfill + `ensureMemberStatusRow` でアプリ／データ層を止血したが、DB 自身が不変条件を強制する構造的ガード（FK）は無い。

## 2. 何を達成するか（What）

`member_status.member_id` に `member_identities(member_id)` への FOREIGN KEY 制約を導入し、orphan の発生を **DB レベルで構造的に禁止**する。あわせて Cloudflare D1 上での `PRAGMA foreign_keys` の有効性・運用を検証・文書化する。

## 3. スコープ

- **含む**: FK 付き `member_status` テーブル再構築 migration（`0026`）追加 / FK 有効性テスト（違反 INSERT 拒否・正常 INSERT 許容）/ 既存データ不変・冪等性の回帰テスト / `idx_member_status_public` 再作成 / D1 上の `PRAGMA foreign_keys` 検証・文書化
- **含まない**: 新規 endpoint・既存 endpoint surface 変更 / `apps/web` 変更 / member 作成経路統一（followup-001 の責務）/ 他テーブルへの FK 導入

## 4. 受け入れ基準（AC）

| # | 基準 |
|---|------|
| AC-1 | 再構築後の `member_status` が `member_id` に `member_identities(member_id)` への FK を持つ |
| AC-2 | `PRAGMA foreign_keys = ON` のもと、存在しない `member_identities` を指す `member_status` INSERT が拒否される |
| AC-3 | 既存の正常 `member_status` データ（全カラム）が移行後も欠落・改変なく保持される |
| AC-4 | migration が冪等であり再適用で重複・破壊が発生しない |
| AC-5 | backfill 0025 適用済み（orphan ゼロ）を前提に移行が FK 違反で失敗しない |
| AC-6 | Cloudflare D1 上で `PRAGMA foreign_keys` の有効性（接続単位 ON 要否）が検証・文書化されている |
| AC-7 | 既存挙動の非回帰: 正常会員の詳細 / status / 一覧レスポンスが従来と同一 |
| AC-8 | `apps/web` は無変更（diff 0） |
| AC-9 | `idx_member_status_public` が再構築後も同一定義で存在する |

## 5. 変更対象ファイル（実装サイクル成果物）

| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/api/migrations/0026_member_status_fk_constraint.sql` | **新規** | FK 付き `member_status` 再構築 migration |
| `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | **新規** | FK 有効性 / 既存データ不変 / 冪等 / INDEX 再作成の D1 contract test |
| `apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts` | **更新** | FK 導入後の `member_status` fixture が親 `member_identities` を満たすよう opt-out gate seed を補正 |
| `apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts` | **更新** | notification opt-out repository upsert fixture が親 `member_identities` を満たすよう補正 |
| `apps/api/src/routes/admin/member-notification-pref.contract.spec.ts` | **更新** | admin notification pref PATCH fixture が親 `member_identities` を満たすよう補正 |
| `apps/api/src/sync/backfill.contract.spec.ts` | **更新** | backfill 不変条件 fixture の既存 `member_status` 行に親 `member_identities` を追加 |
| `apps/api/src/routes/admin/tags-queue.contract.spec.ts` | **更新** | tag queue fixture の `member_status` seed に親 `member_identities` を追加 |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | **更新** | tag queue resolve fixture の `member_status` seed に親 `member_identities` を追加 |
| `apps/api/src/routes/auth/session-resolve.contract.spec.ts` | **更新** | FK 導入後に成立しない orphan `member_status` auto-link fixture を現行不変条件へ補正 |
| `apps/api/src/repository/__tests__/_setup.ts` | **更新** | Miniflare D1 migration 適用を worker 内 1 回にし、full D1 regression の socket exhaustion を防止 |

> `apps/api/migrations/sequence-exceptions.json` は 0026 が新規 unique prefix のため**編集不要**。

## 6. Phase 構成

| Phase | 成果物 | 概要 |
|-------|--------|------|
| 1 | `phase-1-requirements.md` | 要件 / inventory / 命名規約 / P50 |
| 2 | `phase-2-design.md` | 再構築 migration SQL 骨子 / PRAGMA 検証設計 / INDEX 再作成 |
| 3 | `phase-3-design-review.md` | 設計レビューゲート |
| 4 | `phase-4-test-plan.md` | D1 contract test 設計（TDD） |
| 5 | `phase-5-implementation.md` | migration / test 実装手順 |
| 6 | `phase-6-test-additions.md` | fail path / 回帰 guard |
| 7 | `phase-7-coverage.md` | カバレッジ |
| 8 | `phase-8-refactor.md` | リファクタリング |
| 9 | `phase-9-qa.md` | 品質保証 |
| 10 | `phase-10-final-review.md` | 最終レビュー |
| 11 | `outputs/phase-11/manual-test-result.md` | 手動テスト（NON_VISUAL） |
| 12 | `outputs/phase-12/*.md` | ドキュメント更新（strict 7） |
| 13 | `phase-13-pr.md` | PR 作成（user-gated） |

## 7. DoD（Definition of Done・local実装完了条件）

1. `0026_member_status_fk_constraint.sql` が追加され、FK 付き定義へ再構築される
2. D1 contract test が全 GREEN（FK 違反拒否 / 正常許容 / 既存データ不変 / 冪等 / INDEX 再作成）
3. `pnpm verify:d1-migrations` が pass（sequence guard）
4. `apps/web` diff 0
5. 既存 D1 repository / route contract test が FK 前提で非回帰 GREEN
6. AC-1〜AC-9 をすべて満たす

> local実装は本サイクルで実施済み。commit / push / PR / remote D1 apply はすべて **user-gated**。
