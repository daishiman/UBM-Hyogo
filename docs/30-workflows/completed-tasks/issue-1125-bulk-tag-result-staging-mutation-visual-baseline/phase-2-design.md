# Phase 2 — 設計

> **実装区分: 実装仕様書** — 新規 Playwright spec + seed/cleanup SQL + capture runner のコード追加（CONST_004）。

## 2.1 トポロジ（責務境界 / 状態所有権）

result baseline 取得は「seed（副作用投入）→ mutation capture（UI 操作 + screenshot）→ cleanup（副作用回収）」の 3 段で、**副作用の所有権を shell runner に集約**する。Playwright spec は UI 操作と screenshot にのみ責務を持ち、D1 への seed/cleanup は持たない（issue-1081 `runtime-tag-bulk.sh` と同じ責務分離）。

```
scripts/smoke/capture-bulk-tag-result.sh        ← 副作用オーケストレーション（状態所有者）
  ├─ assert_staging_guard                        ← production 拒否 / CF_D1_DATABASE 固定
  ├─ seed()         : cf.sh d1 execute --remote --file bulk-tag-result-staging-seed.sql
  ├─ capture()      : playwright test --project=staging-visual-authenticated \
  │                     admin-members-bulk-tag-result-authenticated --update-snapshots
  │                     （spec が UI 操作 + 実 mutation + toHaveScreenshot を実行）
  └─ trap cleanup EXIT : cf.sh d1 execute --remote --file bulk-tag-result-staging-cleanup.sql
                          → synthetic 残存 0 を count 検証
```

| レイヤ | 責務 | 状態所有権 |
| --- | --- | --- |
| `capture-bulk-tag-result.sh` | guard / seed / capture 起動 / cleanup / 残存検証 / redact ログ | staging D1 の synthetic fixture ライフサイクル |
| `admin-members-bulk-tag-result-authenticated.spec.ts` | storageState 認証 / member 選択 / tag 適用（実 mutation）/ result 待機 / screenshot | UI interaction と snapshot |
| seed/cleanup SQL | synthetic fixture の投入 / 回収（`e2e_test_issue1125_` prefix のみ） | D1 行データ |

---

## 2.2 seed/cleanup SQL 設計

### fixture 構成（prefix `e2e_test_issue1125_`）

| 用途 | member_id | is_deleted | tag_id | active | mutation 後 status |
| --- | --- | --- | --- | --- | --- |
| all-success | `e2e_test_issue1125_as_mem_1` | 0 | `e2e_test_issue1125_tag_1` | 1 | `assigned` |
| all-success | `e2e_test_issue1125_as_mem_2` | 0 | `e2e_test_issue1125_tag_1` | 1 | `assigned` |
| partial-failure | `e2e_test_issue1125_pf_mem_active` | 0 | `e2e_test_issue1125_tag_1` | 1 | `assigned` |
| partial-failure | `e2e_test_issue1125_pf_mem_deleted` | **1** | `e2e_test_issue1125_tag_1` | 1 | `skipped_deleted` → frontend `skipped` list |

> `tag_not_found`（未登録 tag）は UI から自然発生しないため fixture 化しない（Phase 1 §1.2 参照・代替担保あり）。tag は 1 件（`tag_1`）あれば all-success / partial-failure 両方に足りる。識別しやすさのため `tag_2`（active=1）も seed し picker の見栄えを安定させてよい。

### 触る table（issue-1081 seed と同一・ALTER なし）

`member_responses` / `member_identities` / `member_status` / `tag_definitions`。`member_tags` と `audit_log` の synthetic 行は seed 冒頭で `DELETE ... LIKE 'e2e_test_issue1125_%'` して再実行冪等にする（mutation で生成されるため）。

### 🔴 D1 remote トランザクション制約（必須遵守）

**seed/cleanup SQL に `BEGIN TRANSACTION;` / `COMMIT;` を含めない。** Cloudflare D1 remote は `wrangler d1 execute --remote --file` で全文を暗黙アトミックバッチ実行するため、明示 SQL トランザクションを **拒否する**（local miniflare では通るため見落としやすい。reference: `reference_d1_remote_no_sql_transaction`、test-accounts seed で実証済み）。

> issue-1081 の `bulk-tag-staging-seed.sql` は `BEGIN TRANSACTION; ... COMMIT;` を含むが、本タスクはこの既知制約に従い **明示トランザクションを除去した形**で新規作成する（issue-1081 SQL をそのままコピーしない）。各 `INSERT OR REPLACE` / `DELETE` を裸で並べる。

### seed SQL 骨子（`bulk-tag-result-staging-seed.sql`）

```sql
-- Staging-only synthetic seed for issue-1125 bulk tag RESULT visual baseline.
-- prefix `e2e_test_issue1125_`. No BEGIN/COMMIT (D1 remote rejects explicit SQL transactions).
-- Tables (no ALTER): member_responses, member_identities, member_status, tag_definitions.

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM audit_log   WHERE target_id LIKE 'e2e_test_issue1125_%';

INSERT OR REPLACE INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES
  ('e2e_test_issue1125_as_resp_1','e2e_test_issue1125_form','rev1','hash1','e2e_test_issue1125_as_mem_1@example.test', datetime('now'), '{"<fullNameStableKey>":"issue1125 成功 太郎"}'),
  ... (as_mem_2 / pf_mem_active / pf_mem_deleted の 4 response);

INSERT OR REPLACE INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES ... (4 member);

INSERT OR REPLACE INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_issue1125_as_mem_1','consented','consented','member_only',0,'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_as_mem_2','consented','consented','member_only',0,'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_pf_mem_active','consented','consented','member_only',0,'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_pf_mem_deleted','consented','consented','member_only',1,'e2e_test_issue1125_seed', datetime('now'));  -- is_deleted=1

INSERT OR REPLACE INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_issue1125_tag_1','e2e_test_issue1125_code_1','issue1125 結果タグ1','e2e_test_issue1125','[]',1),
  ('e2e_test_issue1125_tag_2','e2e_test_issue1125_code_2','issue1125 結果タグ2','e2e_test_issue1125','[]',1);
```

> `answers_json` の `fullName` stable key は実コード（`STABLE_KEY.fullName`）に合わせる。Phase 5 実装時に `apps/api/src/.../stableKeys`（または既存 seed の answers 形）を確認して埋める。member list に氏名が出ると search で fixture を絞り込みやすく screenshot も安定する。

### cleanup SQL 骨子（`bulk-tag-result-staging-cleanup.sql`）

issue-1081 cleanup 同型（`BEGIN/COMMIT` 除去）。`member_tags`（mutation 生成分）→ `audit_log` → `member_status` → `member_identities` → `member_responses` → `tag_definitions` の順に `DELETE ... LIKE 'e2e_test_issue1125_%'`。

---

## 2.3 capture runner 設計（`scripts/smoke/capture-bulk-tag-result.sh`）

issue-1081 `runtime-tag-bulk.sh` を参照モデルに、**mutation を curl ではなく Playwright UI 経由で起こす**点が異なる。

| 要素 | 設計 |
| --- | --- |
| `set -euo pipefail` | 踏襲 |
| `assert_staging_guard` | 踏襲（`CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / production 拒否 / staging allowlist）。base URL は `PLAYWRIGHT_STAGING_BASE_URL` を検査 |
| `run_d1` | `cf.sh d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"` 踏襲 |
| `seed()` | `run_d1 --file "$SEED_SQL"`、redact ログ |
| `capture()` | `PLAYWRIGHT_EVIDENCE_DIR=<screenshots_dir> PLAYWRIGHT_STAGING_BASE_URL=<staging> pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-result-authenticated --update-snapshots` を実行。runner は `<screenshots_dir>` を `OUT_DIR` の sibling `outputs/phase-11/screenshots` に自動設定し、exit code を検査 |
| `cleanup()` | `trap 'cleanup || true; ...' EXIT` で必ず実行。`run_d1 --file "$CLEANUP_SQL"` 後、`member_tags:member_id` / `audit_log:target_id` / `member_status:member_id` / `member_identities:member_id` / `member_responses:response_id` / `tag_definitions:tag_id` を `count_by_table` で 0 検証（残存時 fail） |
| `redact.sh` | 既存 `scripts/smoke/redact.sh` でログ秘匿化 |
| OUT_DIR | `docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/evidence`（ログ / summary 専用。screenshot copy は sibling `outputs/phase-11/screenshots`） |
| 引数 | `staging [--out-dir <path>] [--skip-seed] [--skip-cleanup] [--ci-summary]`（issue-1081 踏襲） |

> cleanup の堅牢性が AC-5 の核。`trap ... EXIT` により、Playwright 失敗・中断・成功いずれの経路でも cleanup が走り、残存件数 0 を検証してから exit する。

---

## 2.4 Playwright spec 設計（`admin-members-bulk-tag-result-authenticated.spec.ts`）

参照モデル: `admin-members-bulk-tag-authenticated.spec.ts`（read-only picker）。差分は **mutation を実行し result summary を撮る**点。

### 共通

```ts
test.use({ storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json") });
const SNAP = {
  allSuccess: "bulk-tag-result-all-success.png",
  partialFailure: "bulk-tag-result-partial-failure.png",
} as const;
```

`disableAnimations` style / `phase11ScreenshotsDir` への raw screenshot 保存は read-only spec 踏襲。snapshot 名前空間は project 設定の `{arg}-authenticated-staging-visual-{platform}` で、親 local fixture（`issue1036-bulk-member-tags.spec.ts` の同名 png）と **衝突しない**（AC-4）。

### member 選択戦略（退会済み member の可視性）

GET `/admin/members` は is_deleted フィルタを持たず（`members.ts:393-413`、`identity_aliases` のみ除外）退会済み member も `isDeleted` フラグ付きで list に表示される。fixture を確実に掴むため、検索ボックス（存在する場合）に `issue1125` を入力して synthetic member だけに絞り込むか、行 `data-testid="admin-members-row-{memberId}"` / checkbox `aria-label="{fullName} を選択"` を memberId/氏名で locate する。

> Phase 5 実装時に確認: 既定 search で退会済み member が表示されること（除外フィルタが既定 ON なら filter param / クエリで明示表示する）。

### test 1: all-success

1. `goto("/admin/members")` → `会員管理` heading 可視待ち。
2. `e2e_test_issue1125_as_mem_1` / `as_mem_2` の行 checkbox を check。
3. `bulkRegion = getByRole("region", { name: "一括操作" })` → tag picker 可視。
4. tag picker で `issue1125 結果タグ1`（`tag_1`）の `TagPill` を click（assign モード = 既定）。
5. apply ボタン（`${n}人 × ${m}タグ を付与`）を click → **実 mutation**。
6. `getByTestId("bulk-tag-result")` 可視待ち、`bulk-tag-result-counts` に「付与 2」相当・`bulk-tag-result-skipped`/`-not-found` が **count 0** を assert。
7. `addStyleTag(disableAnimations)` → `expect(bulkRegion).toHaveScreenshot(SNAP.allSuccess, { animations:"disabled", maxDiffPixelRatio:0.05 })`。
8. raw screenshot を `phase11ScreenshotsDir` に保存。

### test 2: partial-failure

1. （独立性）`goto` で再ロード。`as` member の選択は解除した状態にする。
2. `pf_mem_active` + `pf_mem_deleted` の行 checkbox を check。
3. tag picker で `tag_1` を選択 → apply → **実 mutation**。
4. `bulk-tag-result` 可視待ち、`getByTestId("bulk-tag-result-skipped")` が可視（退会済みスキップ ≥1）を assert。`bulk-tag-result-counts` に「付与 1 / … / 退会済みスキップ 1」相当。
5. `toHaveScreenshot(SNAP.partialFailure, ...)` + raw 保存。

> test 順序は all-success → partial-failure。mutation は冪等（assign は INSERT OR IGNORE）なので再実行耐性あり。両 test とも apply 後に result が表示されるまで `expect(...).toBeVisible()` で待つ（mutation 完了同期）。

---

## 2.5 既存資産の再利用可否（FB-SDK-07-1）

| 候補 | 再利用 | 判断 |
| --- | --- | --- |
| `staging-visual-authenticated` project | ✅ | `testDir` 自動登録。config 編集不要 |
| read-only spec の storageState / disableAnimations / raw 保存パターン | ✅ | 同型コピーで踏襲 |
| issue-1081 runner の guard / run_d1 / cleanup / count_by_table / redact | ✅（構造） | mutation を curl → Playwright に差し替えて踏襲 |
| issue-1081 seed/cleanup SQL | ⚠️ 構造のみ | `BEGIN/COMMIT` 除去 + 退会済み member 追加で **新規作成**（コピー不可） |
| `BulkActionBar.spec.tsx` TC-BAB-TAG-03 | ✅ 回帰 | result 描画の unit 担保。変更せず実行 |

新規 UI primitive は作らない（screenshot 対象は既存 `BulkActionBar`）。

---

## 2.6 検証フロー（Phase 4-10 の validation path）

1. 静的: `pnpm typecheck` / `pnpm lint`（spec の TS / shell の shellcheck 相当）。
2. 回帰 unit: `BulkActionBar.spec.tsx`（result 描画不変）。
3. runner shell test: `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`（guard 拒否 / 引数 / cleanup 呼び出しの検証・実 D1 を叩かない）。
4. runtime（user-gated）: 認証 staging で `capture-bulk-tag-result.sh staging` を実行 → baseline 生成 + cleanup + 残存 0 検証。
