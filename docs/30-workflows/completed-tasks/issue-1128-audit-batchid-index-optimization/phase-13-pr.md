# Phase 13: PR 作成計画

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1128-audit-batchid-index-optimization` |
| workflow_state | `implemented_local_evidence_captured` |
| phase 状態 | **pending_user_approval** |
| base ブランチ | `dev`（既定。production リリース時のみ `main`） |
| 作業ブランチ | `docs/issue-1128-audit-batchid-index-optimization-spec` |
| related issue | #1128（CLOSED 維持・reopen しない） |
| 種別 | NON_VISUAL / apps/api 専用 / D1 migration + repository SQL 変更 |

> 本ファイルは PR 作成の**計画**であり、実 PR 作成は含まない。
> PR 作成・commit・push・migration apply はすべて **user 明示承認後のみ**実行する（CONST_002）。
> 承認前は本計画に従った準備（含めるファイル一覧の取得方法・本文骨子）のみを記述する。
> local implementation は完了済み。PR 作成、commit、push、staging / production migration apply は user-gated として残す。

---

## 1. 前提（user 承認後に実行）

- 実装サイクル（`0027` migration + `auditLog.ts` の `listFiltered` 切替）が完了し、Gate-B（`phase-9-qa.md`）が
  `passed` であること（typecheck / lint / D1 vitest 非退化 + `EXPLAIN QUERY PLAN` index 走査 assertion 緑）。
- Gate-C 前提として `phase-10-final-review.md` の AC-1..7 評価が PASS であること。
- Phase 11（`phase-11-manual-test.md`）の NON_VISUAL 証跡（D1 自動テスト出力 + `EXPLAIN QUERY PLAN` テキスト）が
  `outputs/phase-11/` に取得済みであること。
- base ブランチは `dev`。作業ブランチは `docs/issue-1128-audit-batchid-index-optimization-spec`。

---

## 2. 事前ゲート（PR 作成前に実行・user 承認後）

CLAUDE.md「PR作成の完全自律フロー」の品質検証 4 コマンドを実行する。

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift を一括検証
```

- 失敗時は最大 3 回まで自動修復し、修復差分をコミットする。
- `bash scripts/verify-pr-ready.sh` 失敗時は
  `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照
  （`gate-metadata:validate` → `verify:phase12-compliance` → `indexes:rebuild` drift の順で切り分け）。
- `git fetch origin dev` でローカル `dev` を fast-forward 同期し、作業ブランチへ `dev` をマージしてから PR を作成する。

---

## 3. PR タイトル（案）

```
perf(issue-1128): audit_log batchId 検索を json_extract full scan から index 列走査へ最適化（#1079 follow-up）
```

---

## 4. PR 本文 骨子

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md`
の内容を漏れなく反映する。骨子は以下。

### 4.1 概要
- 親 #1036 が軽量方針で audit JSON payload に埋め込んだ `batchId`（assign=`after_json`/unassign=`before_json` の
  非対称配置）について、#1079 で追加した `GET /admin/audit` の batchId 検索が `json_extract` full scan になっている問題を、
  相関列 + index 追加により index 列走査へ最適化する。
- Issue #1128 は #1079 Phase 12 の未タスク検出（baseline B-1）から起票された follow-up。**CLOSED のまま** follow-up 実装として扱う（reopen しない）。

### 4.2 変更点
- **`apps/api/migrations/0027_audit_log_batchid_index.sql`（新規）**:
  batchId 相関列 + index を追加。
  - 方式A（採用時）: VIRTUAL generated column `batch_id` =
    `COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId'))` + `idx_audit_log_batch_id`。
    既存行へ自動波及・backfill UPDATE / write path 変更不要。
  - 方式B（fallback 採用時）: plain `correlation_id` 列 + backfill UPDATE + `idx_audit_log_correlation_id` +
    `append` write path 拡張。
  - 採用方式は Phase 2 の Miniflare D1 実測（`EXPLAIN QUERY PLAN`）結果に従い、本文で明記する。
- **`apps/api/src/repository/auditLog.ts`（編集）**:
  `listFiltered` の batchId 分岐（`:200-205`）を `json_extract` OR full scan から `WHERE batch_id = ?`（方式A）/
  `WHERE correlation_id = ?`（方式B）の index 列走査へ切替。方式B 採用時のみ `append`（`:103-138`）の INSERT に相関列を追加。
- query surface は不変（batchId param は #1079 で確定済み・`apps/api/src/routes/admin/audit.ts` 変更なし）。

### 4.3 受入条件 達成状況（Gate-C 結果と紐付け）
- AC-1（相関列を `0027` で追加）/ AC-2（index + `EXPLAIN QUERY PLAN` で full scan でないこと確認）/
  AC-3（after-before COALESCE で 1 列集約）/ AC-4（既存行も検索に乗る）/ AC-5（返却結果が切替前と同一・非退化）/
  AC-6（rollback 手順）/ AC-7（append-only 維持・UPDATE/DELETE 非 export）の達成を `phase-10-final-review.md` と紐付けて記載。

### 4.4 テスト結果
- D1 vitest（`vitest.d1.config.ts`）:
  - `apps/api/src/repository/__tests__/auditLog.repository.spec.ts`（batchId ケース非退化 + index 走査）
  - `apps/api/src/routes/admin/audit.contract.spec.ts`（contract 非退化）
- `EXPLAIN QUERY PLAN` 出力に `USING INDEX idx_audit_log_batch_id`（方式B は `_correlation_id`）が現れ
  `SCAN audit_log` でないこと。
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` green。
- 実行コマンド:
  ```bash
  mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
    apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
    apps/api/src/routes/admin/audit.contract.spec.ts
  ```

### 4.5 migration & rollback
- migration: `0027_audit_log_batchid_index.sql`。`_setup.ts` が `apps/api/migrations/*.sql` を sort 順に
  全適用するため、D1 テストでは自動で乗る（単文 DDL・`BEGIN..END` 不使用）。
- rollback（migration 末尾コメントに併記）:
  ```sql
  -- 方式A
  DROP INDEX IF EXISTS idx_audit_log_batch_id;
  ALTER TABLE audit_log DROP COLUMN batch_id;
  -- 方式B
  DROP INDEX IF EXISTS idx_audit_log_correlation_id;
  ALTER TABLE audit_log DROP COLUMN correlation_id;
  ```
- sequence guard: `mise exec -- pnpm verify:d1-migrations` /
  `node --test scripts/__tests__/verify-d1-migration-sequence.test.mjs` を通す。

### 4.6 リスク
- VIRTUAL 列の index を D1 が拒否する可能性 → Phase 2 実測で判定済み・拒否時は方式B（plain `correlation_id`）へ fallback。
- 親 #1036 の軽量 batchId 方針（schema 変更なし）との整合 → 本タスクは「full scan コスト顕在化時のトリガ付き別関心」で、
  ユーザー指示により今サイクルで根本解決する旨を明記。
- 既存 audit 行の再計算コスト → 方式A（VIRTUAL）は再計算ゼロ（index 構築のみ）。方式B は `WHERE correlation_id IS NULL` の
  backfill UPDATE のみ。production apply はメンテ枠で実行（後述 §7）。

### 4.7 不変条件遵守
- D1 直アクセス（#5）= 相関列検索は `apps/api` のみ。`apps/web` から D1 binding なし。
- query surface 不変（既存 API endpoint のみ・新 endpoint なし）。
- append-only 維持（#AC-7・`auditLog.ts` から UPDATE/DELETE 非 export・backfill は migration 内 SQL のみ）。

### 4.8 スクリーンショット
- NON_VISUAL タスクのため screenshot は **無し**。スクリーンショット専用セクションを作らない
  （`outputs/phase-11/` に画像が存在しないため）。

---

## 5. 含めるファイル一覧の取得方法

PR 作成時に以下で確定する（diff-to-pr 完全自律フロー準拠）。

```bash
git fetch origin dev
git diff dev...HEAD --name-only   # PR に含まれるファイル一覧（漏れなし確認）
git status --porcelain            # 未コミット変更が空であること
```

想定される変更ファイル:

| パス | 区分 |
| --- | --- |
| `apps/api/migrations/0027_audit_log_batchid_index.sql` | 新規 |
| `apps/api/src/repository/auditLog.ts` | 編集 |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | 追記 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | 追記（非退化 + index 走査 assertion） |
| `docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/**` | 仕様書 + Phase 12 成果物一式 |
| `docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md` | consumed pointer 追記 |

> `apps/api/src/routes/admin/audit.ts` は query surface 不変のため原則変更なし（方式B でも route は不変）。

---

## 6. PR 作成コマンド（user 承認後）

```bash
gh pr create --base dev \
  --title "perf(issue-1128): audit_log batchId 検索を json_extract full scan から index 列走査へ最適化（#1079 follow-up）" \
  --body-file <本文ファイル>
```

> base は `dev`（production リリース時のみ `--base main`）。
> PR 本文では「#1128 follow-up 実装」と参照する（Issue は CLOSED 維持・reopen しない）。
> PR 本文末尾には diff-to-pr 規約に従い生成署名を付す。

---

## 7. migration apply（PR とは別の user-gated ステップ）

migration の staging / production apply は **PR とは独立した user-gated 操作**であり、PR マージとは別タイミングで
ユーザー承認後に実行する。`wrangler` 直呼び禁止・`scripts/cf.sh` ラッパーのみ使用。

```bash
# 適用前の確認（read-only・事前 evidence として取得可）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 適用（user 明示承認後のみ）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

> production apply はメンテ枠で実行する。方式A（VIRTUAL）は既存行再計算ゼロのため低リスク。
> 万一の問題時は §4.5 の rollback SQL を `bash scripts/cf.sh d1 execute ...` 相当で適用する（これも user-gated）。

---

## 8. PR 作成前チェック

- `git status --porcelain` が空であること。
- `git diff dev...HEAD --name-only` が取得できていること。
- `outputs/phase-12/implementation-guide.md` の主要見出し（Part 1 / Part 2）が PR 本文に反映されていること。
- NON_VISUAL のためスクリーンショット専用セクションを本文に残さないこと。
- 品質検証 4 コマンド（`pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`）が緑であること。

---

## 9. 判定

**Phase 13 = pending_user_approval**

- PR 作成・commit・push・migration apply は user 明示承認後のみ実行する（CONST_002）。
- 承認前は本計画（タイトル / 本文骨子 / ファイル一覧取得方法 / 作成コマンド / migration apply 手順）の記述に留める。
- Issue #1128 は CLOSED 維持・PR 本文で follow-up 実装として参照する（reopen しない）。

---

## 完了条件 (DoD)

- PR タイトル / 本文骨子（概要 / 変更点 / AC 充足 / テスト結果 / migration & rollback / リスク）が記述されている。
- 事前ゲート 4 コマンドが記述されている。
- migration apply が PR とは別の user-gated ステップであることが記述されている。
- base = dev・branch = `docs/issue-1128-audit-batchid-index-optimization-spec`・PR 作成コマンド・作成前チェックが記述されている。
- NON_VISUAL のためスクリーンショット節を作らない旨が明記されている。
- phase 状態 = pending_user_approval（user 承認後のみ実行）が明記されている。
- Issue #1128 CLOSED 維持が明記されている。
