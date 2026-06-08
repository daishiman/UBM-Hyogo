# Phase 5 — 実装手順

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 + seed/cleanup SQL 2 + capture runner shell 1 のコード追加を伴う（CONST_004）。

副作用の所有権を shell runner（`capture-bulk-tag-result.sh`）に集約し、Playwright spec は UI 操作 + 実 mutation + screenshot にのみ責務を持つ（Phase 2 §2.1）。seed/cleanup SQL は `e2e_test_issue1125_` synthetic prefix のみを触り、`BEGIN TRANSACTION`/`COMMIT` を含めない（D1 remote 制約）。

---

## 5.1 変更ファイル一覧（CONST_005）

| 区分 | パス | 備考 |
| --- | --- | --- |
| 新規（spec） | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts` | mutation interaction-gated・result 2 状態 baseline |
| 新規（seed SQL） | `apps/api/migrations/seed/bulk-tag-result-staging-seed.sql` | synthetic fixture 投入（退会済み member 含む） |
| 新規（cleanup SQL） | `apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql` | synthetic fixture 回収（6 table prefix DELETE） |
| 新規（runner shell） | `scripts/smoke/capture-bulk-tag-result.sh` | guard / seed / capture 起動 / trap cleanup / 残存 0 検証 / redact ログ |
| 新規（runner test） | `scripts/smoke/__tests__/capture-bulk-tag-result.test.sh` | **Phase 6 で追加**（本 Phase 5 では作成しない）。guard/引数/cleanup の shell 検証 |
| config 編集 | — | **不要**。`staging-visual-authenticated` project は `testDir: ./playwright/tests/visual-staging-authenticated` で自動登録。ファイルを置くだけで `--project=staging-visual-authenticated` に含まれる。 |
| apps/api・apps/web src・D1 schema・Google Form | — | 一切変更しない（AC-8）。`migrations/seed/` は synthetic データ投入であり table 定義（schema）変更ではない。 |

---

## 5.2 Playwright spec 骨子（`admin-members-bulk-tag-result-authenticated.spec.ts`）

read-only 先例 spec（`admin-members-bulk-tag-authenticated.spec.ts`）の import / storageState / disableAnimations / `phase11ScreenshotsDir` を踏襲。差分は **member を選択して tag を適用（実 mutation）し result summary を撮る**点。

```ts
// workflow: issue-1125 / Phase 5 §5.2
// issue-1036 followup-001 残スコープ: 認証付き staging /admin/members で実 POST /admin/members/tags/bulk
// mutation を経た BulkActionBar result summary の all-success / partial-failure 2 状態を visual baseline 化する。
// storageState は setup.staging-auth.ts が mint した admin role。
// 副作用（seed/cleanup）は scripts/smoke/capture-bulk-tag-result.sh が所有する（この spec は持たない）。

import { mkdirSync } from "node:fs";
import path, { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase11ScreenshotsDir = resolve(
  __dirname,
  "../../../../../docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/screenshots",
);

const SNAP = {
  allSuccess: "bulk-tag-result-all-success.png",
  partialFailure: "bulk-tag-result-partial-failure.png",
} as const;

// synthetic fixture（seed SQL と一致させる）
const MEMBER = {
  asMem1: "e2e_test_issue1125_as_mem_1",
  asMem2: "e2e_test_issue1125_as_mem_2",
  pfActive: "e2e_test_issue1125_pf_mem_active",
  pfDeleted: "e2e_test_issue1125_pf_mem_deleted",
} as const;
const TAG_LABEL = "issue1125 結果タグ1"; // tag_definitions.label（seed SQL と一致）

const disableAnimations =
  "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }";

test.use({
  storageState: join(__dirname, "..", "..", ".auth", "admin.storageState.json"),
});

// 行 checkbox を memberId で locate する helper。
// MembersTable 行は data-testid="admin-members-row-{memberId}"・行内 checkbox は aria-label="{fullName} を選択"。
function memberCheckbox(page: import("@playwright/test").Page, memberId: string) {
  return page.locator(`[data-testid="admin-members-row-${memberId}"] input[type="checkbox"]`);
}

async function selectTagAndApply(page: import("@playwright/test").Page) {
  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });
  const tagPicker = bulkRegion.getByRole("region", { name: "タグ一括付与・解除" });
  await expect(tagPicker).toBeVisible();
  // 付与モード（既定）であることを確認
  const modeGroup = bulkRegion.getByRole("group", { name: "付与モード" });
  await expect(modeGroup.getByRole("button", { name: "付与" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // tag pill を選択（TagPill = button。label をテキストで locate）
  await tagPicker.getByRole("button", { name: TAG_LABEL }).click();
  // apply ボタン: `{n}人 × {m}タグ を付与`
  const applyButton = bulkRegion.getByRole("button", { name: /人 × .+タグ を付与$/ });
  await expect(applyButton).toBeEnabled();
  await applyButton.click(); // ← 実 mutation
  return bulkRegion;
}

test("staging /admin/members bulk tag result all-success baseline", async ({ page }) => {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "会員管理" })).toBeVisible({ timeout: 10_000 });

  await memberCheckbox(page, MEMBER.asMem1).check();
  await memberCheckbox(page, MEMBER.asMem2).check();

  const bulkRegion = await selectTagAndApply(page);

  // mutation 完了同期: result summary が描画されるまで待つ
  const result = page.getByTestId("bulk-tag-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("bulk-tag-result-counts")).toContainText("付与 2");
  await expect(page.getByTestId("bulk-tag-result-skipped")).toHaveCount(0);
  await expect(page.getByTestId("bulk-tag-result-not-found")).toHaveCount(0);

  await page.addStyleTag({ content: disableAnimations });
  await expect(bulkRegion).toHaveScreenshot(SNAP.allSuccess, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, "bulk-tag-result-all-success-authenticated-staging.png"),
    animations: "disabled",
  });
});

test("staging /admin/members bulk tag result partial-failure (skipped) baseline", async ({
  page,
}) => {
  // 独立性: 再ロードで前 test の選択を持ち越さない
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "会員管理" })).toBeVisible({ timeout: 10_000 });

  // active + 退会済み member を混在選択（members.ts は is_deleted 無フィルタ＝退会済みも list 表示）
  await memberCheckbox(page, MEMBER.pfActive).check();
  await memberCheckbox(page, MEMBER.pfDeleted).check();

  const bulkRegion = await selectTagAndApply(page);

  const result = page.getByTestId("bulk-tag-result");
  await expect(result).toBeVisible({ timeout: 15_000 });
  // 退会済み skipped を含む partial-failure
  await expect(page.getByTestId("bulk-tag-result-skipped")).toBeVisible();
  await expect(page.getByTestId("bulk-tag-result-counts")).toContainText("付与 1");
  await expect(page.getByTestId("bulk-tag-result-counts")).toContainText("退会済みスキップ 1");

  await page.addStyleTag({ content: disableAnimations });
  await expect(bulkRegion).toHaveScreenshot(SNAP.partialFailure, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, "bulk-tag-result-partial-failure-authenticated-staging.png"),
    animations: "disabled",
  });
});
```

> 補足:
> - 行 checkbox の locate は memberId 直指定（`memberCheckbox`）を既定とする。fixture が氏名（`fullName`）を持つので、必要なら検索ボックスに `issue1125` を入力して synthetic member だけに絞り込んでもよい（screenshot 安定化）。
> - `bulkRegion` を locator scope して picker 領域 + result summary のみを baseline 化する（画面全体ではなく local fixture と意味的に揃える・AC-4）。
> - test 順序は all-success → partial-failure（宣言順）。assign は `INSERT OR IGNORE`（`memberTags.ts:216`）で冪等のため runner 再実行に耐える。

---

## 5.3 seed SQL 骨子（`bulk-tag-result-staging-seed.sql`）

🔴 **`BEGIN TRANSACTION;` / `COMMIT;` を含めない**（D1 remote は `wrangler d1 execute --remote --file` で暗黙アトミックバッチ実行するため明示トランザクションを拒否する。reference: `reference_d1_remote_no_sql_transaction`）。issue-1081 seed をコピーせず、明示トランザクションを除去した形で新規作成する。各 `DELETE` / `INSERT OR REPLACE` を裸で並べる（冒頭 DELETE で再実行冪等）。

```sql
-- Staging-only synthetic seed for issue-1125 bulk tag RESULT visual baseline.
-- prefix `e2e_test_issue1125_`. No BEGIN/COMMIT (D1 remote rejects explicit SQL transactions).
-- Tables touched (no ALTER): member_responses, member_identities, member_status, tag_definitions.
-- Invariant: never seed real PII; never run outside staging.
-- partial-failure を再現するため pf_mem_deleted は is_deleted=1。

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM audit_log   WHERE target_id LIKE 'e2e_test_issue1125_%';

INSERT OR REPLACE INTO member_responses
  (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES
  ('e2e_test_issue1125_as_resp_1', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_as_mem_1@example.test', datetime('now'), '{"fullName":"issue1125 成功 太郎"}'),
  ('e2e_test_issue1125_as_resp_2', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_as_mem_2@example.test', datetime('now'), '{"fullName":"issue1125 成功 花子"}'),
  ('e2e_test_issue1125_pf_resp_active', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_pf_mem_active@example.test', datetime('now'), '{"fullName":"issue1125 在籍 一郎"}'),
  ('e2e_test_issue1125_pf_resp_deleted', 'e2e_test_issue1125_form', 'rev1', 'hash1',
   'e2e_test_issue1125_pf_mem_deleted@example.test', datetime('now'), '{"fullName":"issue1125 退会 二郎"}');

INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_issue1125_as_mem_1', 'e2e_test_issue1125_as_mem_1@example.test',
   'e2e_test_issue1125_as_resp_1', 'e2e_test_issue1125_as_resp_1', datetime('now')),
  ('e2e_test_issue1125_as_mem_2', 'e2e_test_issue1125_as_mem_2@example.test',
   'e2e_test_issue1125_as_resp_2', 'e2e_test_issue1125_as_resp_2', datetime('now')),
  ('e2e_test_issue1125_pf_mem_active', 'e2e_test_issue1125_pf_mem_active@example.test',
   'e2e_test_issue1125_pf_resp_active', 'e2e_test_issue1125_pf_resp_active', datetime('now')),
  ('e2e_test_issue1125_pf_mem_deleted', 'e2e_test_issue1125_pf_mem_deleted@example.test',
   'e2e_test_issue1125_pf_resp_deleted', 'e2e_test_issue1125_pf_resp_deleted', datetime('now'));

INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_issue1125_as_mem_1', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_as_mem_2', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_pf_mem_active', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1125_seed', datetime('now')),
  ('e2e_test_issue1125_pf_mem_deleted', 'consented', 'consented', 'member_only', 1, 'e2e_test_issue1125_seed', datetime('now'));  -- is_deleted=1（partial-failure skipped 用）

INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_issue1125_tag_1', 'e2e_test_issue1125_code_1', 'issue1125 結果タグ1', 'e2e_test_issue1125', '[]', 1),
  ('e2e_test_issue1125_tag_2', 'e2e_test_issue1125_code_2', 'issue1125 結果タグ2', 'e2e_test_issue1125', '[]', 1);
```

> `answers_json` の `fullName` stable key は実コードで確認済み（`apps/api/src/repository/_shared/builder.ts:105` が `STABLE_KEY.fullName`、その値は literal `"fullName"`。`members.fixture.ts:163` の `stable_key: "fullName"` とも一致）。member list に氏名が出ると検索で fixture を絞り込みやすく screenshot も安定する。tag_2（active=1）は picker の見栄え安定用で mutation には未使用。

---

## 5.4 cleanup SQL 骨子（`bulk-tag-result-staging-cleanup.sql`）

issue-1081 cleanup 同型だが **`BEGIN/COMMIT` を除去**する。`member_tags`（mutation 生成分）→ `audit_log` → `member_status` → `member_identities` → `member_responses` → `tag_definitions` の順に prefix LIKE で DELETE する（6 table）。

```sql
-- Remove issue-1125 bulk tag result visual baseline fixtures.
-- No BEGIN/COMMIT (D1 remote rejects explicit SQL transactions).
-- Invariant: every DELETE targets only the `e2e_test_issue1125_%` synthetic prefix.

DELETE FROM member_tags       WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM audit_log         WHERE target_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_status     WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_issue1125_%';
DELETE FROM member_responses  WHERE response_id LIKE 'e2e_test_issue1125_%';
DELETE FROM tag_definitions   WHERE tag_id LIKE 'e2e_test_issue1125_%';
```

---

## 5.5 capture runner 骨子（`scripts/smoke/capture-bulk-tag-result.sh`）

issue-1081 `runtime-tag-bulk.sh` を参照モデルに、**mutation を curl ではなく Playwright UI 経由で起こす**（`post_bulk` を `capture` に差し替え）。guard / `run_d1` / `count_by_table` / `cleanup` / `redact` / `trap ... EXIT` は踏襲。

```bash
#!/usr/bin/env bash
# Staging bulk tag RESULT visual baseline capture runner (issue-1125).
# seed → playwright capture(実 mutation + toHaveScreenshot) → trap cleanup EXIT → 残存 0 検証。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || cd "$SCRIPT_DIR/../.." && pwd)"
REDACT="$SCRIPT_DIR/redact.sh"
CF_SH="${CF_SH_PATH:-$REPO_ROOT/scripts/cf.sh}"
PREFIX="e2e_test_issue1125_"
CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-staging}"
SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-result-staging-seed.sql"
CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql"
SPEC_FILTER="admin-members-bulk-tag-result-authenticated"

ENVIRONMENT=""
BASE=""
OUT_DIR="docs/30-workflows/completed-tasks/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/evidence"
SCREENSHOTS_DIR="$(dirname "$OUT_DIR")/screenshots"
OUT_LOG=""
SUMMARY_JSON=""
CI_SUMMARY=0
SKIP_SEED=0
SKIP_CLEANUP=0
OVERALL_STATUS="PASS"
SUMMARY_ENTRIES=()
CLEANUP_RAN=0

usage() {
  cat >&2 <<'EOF'
usage: capture-bulk-tag-result.sh staging [--out-dir <path>] [--skip-seed] [--skip-cleanup] [--ci-summary]
EOF
}

write_summary() { :; }   # issue-1081 と同型（CI_SUMMARY 時に summary.json を書く）
summary_pass()  { SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"PASS"}' "$1")"); }
fail_and_exit() { OVERALL_STATUS="FAIL"; echo "FAIL: $*" >&2; write_summary; exit 1; }

parse_args() {
  ENVIRONMENT="${1:-}"
  if [[ -z "$ENVIRONMENT" ]]; then echo "env required" >&2; usage; exit 2; fi
  shift || true
  if [[ "$ENVIRONMENT" != "staging" ]]; then echo "Only staging capture is allowed" >&2; exit 2; fi
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --out-dir) OUT_DIR="${2:-}"; [[ -z "$OUT_DIR" ]] && { echo "--out-dir requires a path" >&2; exit 2; }; shift 2 ;;
      --ci-summary) CI_SUMMARY=1; shift ;;
      --skip-seed) SKIP_SEED=1; shift ;;
      --skip-cleanup) SKIP_CLEANUP=1; shift ;;
      *) echo "unknown argument: $1" >&2; exit 2 ;;
    esac
  done
  BASE="${PLAYWRIGHT_STAGING_BASE_URL:-}"
  if [[ -z "$BASE" ]]; then echo "PLAYWRIGHT_STAGING_BASE_URL is required" >&2; exit 2; fi
  BASE="${BASE%/}"
}

assert_staging_guard() {
  local allow_regex="${STAGING_API_HOST_ALLOW_REGEX:-staging|127\.0\.0\.1|localhost}"
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-staging" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-staging" >&2; exit 2
  fi
  if printf '%s\n' "$BASE" | grep -Eiq 'production|ubm-hyogo-(web|api)-production'; then
    echo "production target refused" >&2; exit 2
  fi
  if ! printf '%s\n' "$BASE" | grep -Eiq "$allow_regex"; then
    echo "PLAYWRIGHT_STAGING_BASE_URL must match staging allowlist" >&2; exit 2
  fi
}

run_d1() { bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"; }

seed() {
  if [[ "$SKIP_SEED" -eq 1 ]]; then summary_pass "seed-skip"; return 0; fi
  run_d1 --file "$SEED_SQL" | bash "$REDACT" >> "$OUT_LOG"
  summary_pass "seed"
}

capture() {
  # Playwright が UI から実 mutation を起こし result 2 状態を toHaveScreenshot で撮る。
  set +e
  PLAYWRIGHT_EVIDENCE_DIR="$SCREENSHOTS_DIR" PLAYWRIGHT_STAGING_BASE_URL="$BASE" \
    mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
    --project=staging-visual-authenticated "$SPEC_FILTER" --update-snapshots \
    2>&1 | bash "$REDACT" >> "$OUT_LOG"
  local code="${PIPESTATUS[0]}"
  set -e
  if [[ "$code" -ne 0 ]]; then fail_and_exit "capture playwright exit=$code"; fi
  summary_pass "capture"
}

extract_count() { jq -r '(.. | objects | select(has("c")) | .c) // empty' | head -n1; }

count_by_table() {
  local table="$1" column="$2" raw
  raw="$(run_d1 --json --command "SELECT count(*) AS c FROM ${table} WHERE ${column} LIKE '${PREFIX}%';")"
  printf '%s\n' "$raw" | bash "$REDACT" >> "$OUT_LOG"
  printf '%s\n' "$raw" | extract_count
}

cleanup() {
  if [[ "$CLEANUP_RAN" -eq 1 || "$SKIP_CLEANUP" -eq 1 || -z "${OUT_LOG:-}" ]]; then return 0; fi
  CLEANUP_RAN=1
  run_d1 --file "$CLEANUP_SQL" | bash "$REDACT" >> "$OUT_LOG"
  local item table column count
  for item in "member_tags:member_id" "audit_log:target_id" "member_status:member_id" \
              "member_identities:member_id" "member_responses:response_id" "tag_definitions:tag_id"; do
    table="${item%%:*}"; column="${item##*:}"
    count="$(count_by_table "$table" "$column")"
    if [[ "$count" != "0" ]]; then fail_and_exit "cleanup-$table residual=$count"; fi
  done
  summary_pass "cleanup"
}

main() {
  parse_args "$@"
  assert_staging_guard
  mkdir -p "$OUT_DIR"
  OUT_LOG="$OUT_DIR/capture-bulk-tag-result.log"
  SUMMARY_JSON="$OUT_DIR/summary.json"
  umask 077
  : > "$OUT_LOG"
  trap 'cleanup || true; write_summary' EXIT

  seed
  capture
  cleanup
  write_summary
  echo "bulk tag result visual baseline capture PASS"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
```

> `trap 'cleanup || true; write_summary' EXIT` が AC-5 の核。Playwright 失敗・中断・成功いずれの経路でも cleanup が走り、6 table の synthetic 残存件数 0 を検証してから exit する。残存 ≠ 0 なら `fail_and_exit` で非 0 exit し放置しない。

---

## 5.6 入力・出力・副作用

| 種別 | 内容 |
| --- | --- |
| 入力 | `PLAYWRIGHT_STAGING_BASE_URL`（staging web）/ `CF_D1_DATABASE=ubm-hyogo-db-staging` / admin storageState（`setup.staging-auth.ts` mint）/ seed SQL の synthetic fixture |
| 出力 | baseline 2 枚（`*-snapshots/bulk-tag-result-{all-success,partial-failure}.png-authenticated-staging-visual-{platform}.png`）/ phase-11 raw screenshot 2 枚 / redact 済みログ（`$OUT_DIR/capture-bulk-tag-result.log`）/ `summary.json`（`--ci-summary` 時） |
| 副作用（D1） | seed: `member_responses` / `member_identities` / `member_status` / `tag_definitions` への synthetic 行投入。mutation: `member_tags` への INSERT + `audit_log` への append（`admin.member.tag_assigned`）。**すべて `e2e_test_issue1125_` prefix 限定**。 |
| 副作用の回収 | cleanup SQL（6 table prefix DELETE）+ 残存 0 検証。`trap ... EXIT` で確実に実行。回収後 staging D1 は初期状態へ収束（恒久副作用ゼロ）。 |

---

## 5.7 baseline 保存先（snapshotPathTemplate 由来）

```
apps/web/playwright/tests/visual-staging-authenticated/
  admin-members-bulk-tag-result-authenticated.spec.ts-snapshots/
    bulk-tag-result-all-success.png-authenticated-staging-visual-{platform}.png
    bulk-tag-result-partial-failure.png-authenticated-staging-visual-{platform}.png
```

local fixture spec（`issue1036-bulk-member-tags.spec.ts`）の同名 png とは project / testDir / 名前空間（`-authenticated-staging-visual-{platform}`）が分離されるため衝突しない（AC-4）。

---

## 5.8 実装順序

1. **seed SQL** `bulk-tag-result-staging-seed.sql` を作成（`BEGIN/COMMIT` 無し・退会済み member 含む 4 member + 2 tag）。
2. **cleanup SQL** `bulk-tag-result-staging-cleanup.sql` を作成（`BEGIN/COMMIT` 無し・6 table prefix DELETE）。
3. **runner shell** `capture-bulk-tag-result.sh` を作成（guard / seed / capture / trap cleanup / 残存 0 検証 / redact）。`chmod +x`。
4. **Playwright spec** `admin-members-bulk-tag-result-authenticated.spec.ts` を作成（all-success / partial-failure 2 test）。
5. ローカル検証: `pnpm typecheck` / `pnpm lint` / 回帰 `BulkActionBar.spec.tsx` を実行（Phase 4 §4.6）。
6. （Phase 6）runner test `__tests__/capture-bulk-tag-result.test.sh` を追加し `bash` で実行（実 D1 を叩かない）。
7. （user-gated runtime）`capture-bulk-tag-result.sh staging` で baseline mint + cleanup 残存 0 検証 + 目視レビュー。

---

## 5.9 DoD チェックリスト

- [ ] seed/cleanup SQL に `BEGIN TRANSACTION`/`COMMIT` を含めていない（D1 remote 制約・5.3/5.4）
- [ ] seed SQL の `pf_mem_deleted` が `is_deleted=1`（partial-failure skipped 再現）
- [ ] seed/cleanup の DELETE/INSERT がすべて `e2e_test_issue1125_` prefix 限定（AC-5）
- [ ] runner が `assert_staging_guard`（production 拒否 / `CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / staging allowlist）を持つ（AC-7）
- [ ] runner が `trap 'cleanup || true; ...' EXIT` で cleanup を確実に実行し 6 table の残存 0 を検証する（AC-5）
- [ ] runner が redact 済みログに seed/cleanup 結果・対象 URL・capture command・保存先を残す（AC-6）
- [ ] Playwright spec が `test.use({ storageState })` で admin を注入している
- [ ] all-success test: member 2 名選択 → tag 適用 → `付与 2` / skipped 0 / notFound 0 を assert → `bulk-tag-result-all-success.png` capture（AC-2 / AC-4）
- [ ] partial-failure test: active + 退会済み混在選択 → tag 適用 → `bulk-tag-result-skipped` visible / `退会済みスキップ 1` を assert → `bulk-tag-result-partial-failure.png` capture（AC-3 / AC-4）
- [ ] 両 test とも apply 後に `getByTestId("bulk-tag-result")` の `toBeVisible` で mutation 完了を同期してから screenshot
- [ ] canonical screenshot 名が phase-11 / implementation-guide / artifacts ledger（`canonical_screenshots`）と一致（AC-4）
- [ ] apps/api・apps/web src・D1 schema（table 定義）・Google Form を変更していない（AC-8）
- [ ] `pnpm typecheck` / `pnpm lint` / 回帰 `BulkActionBar.spec.tsx` が PASS
- [ ] runner test（Phase 6）が PASS（guard 拒否 / 引数 / cleanup・実 D1 非依存）
- [ ] （user-gated runtime 完了後）baseline 2 枚生成 + cleanup 後 synthetic 残存 0 + 目視レビュー済み（AC-1 / AC-2 / AC-3 / AC-5）
- [ ] GitHub issue #1125 は CLOSED 維持・reopen していない
