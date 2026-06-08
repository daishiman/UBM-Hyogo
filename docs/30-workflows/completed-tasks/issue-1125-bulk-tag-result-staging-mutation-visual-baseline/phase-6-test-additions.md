# Phase 6: テスト追加（fail path / 回帰 guard / runner shell test）

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 + 新規 runner shell test 1 の assertion / fail path を設計する。コードは仕様書内の例として示す。

## 6.0 目的

result baseline は **実 mutation を経た到達状態**を撮る。そのため Phase 6 では 3 系統を設計する:

1. **Playwright spec の fail path / mutation 完了同期 assert**（`admin-members-bulk-tag-result-authenticated.spec.ts`）— 「期待した result 状態に到達できたこと」を非 snapshot assertion で固める。
2. **新規 runner shell test の追加**（`scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`）— guard 拒否 / 引数 parse / cleanup 呼び出しを実 D1・実 staging を叩かずに検証する（Phase 3 §3.5 申し送り）。
3. **回帰 guard**（既存 `BulkActionBar.spec.tsx` の無変更緑維持）。

snapshot だけでは「空ページ / mutation 不発で何も出ていない画面」を baseline として焼き込む退行を検出できないため、すべて非 snapshot assertion で前提を固める。

---

## 6.1 Playwright spec fail path 一覧

| ID | 前提未達 | 検出方法 | fail メッセージ（例） |
| --- | --- | --- | --- |
| FP-01 | storageState 不在 / 非 admin | `/admin/members` 到達後 `admin-members-row-*` が 0 件 | `認証付き admin storageState で /admin/members に到達できませんでした（行 0 件）。setup.staging-auth.ts の mint を確認` |
| FP-02 | seed 未投入で synthetic member 不在 | `e2e_test_issue1125_as_mem_1` 行 locator の `count()` < 1 | `synthetic member 行が見つかりません（capture-bulk-tag-result.sh の seed を確認）` |
| FP-03 | tag picker に synthetic tag 不在 | tag pill `issue1125 結果タグ1` が 0 件 | `synthetic tag が picker に描画されていません（tag_definitions seed / active=1 を確認）` |
| FP-04 | mutation 後 result 未描画 | apply 後 `bulk-tag-result` が timeout 内に visible にならない | `apply 後に result サマリーが描画されませんでした（POST /admin/members/tags/bulk の成否を確認）` |
| FP-05 | snapshot 不一致 | `toHaveScreenshot` の組込み比較 | Playwright 既定の diff レポート（CI artifact） |

FP-01..04 は `toBeVisible` / `toBeGreaterThanOrEqual` / カスタム message で **snapshot 比較の前に**落とす。

```ts
const asRow1 = page.getByTestId("admin-members-row-e2e_test_issue1125_as_mem_1");
await expect(asRow1, "synthetic member 行が見つかりません（seed を確認）").toBeVisible({ timeout: 15_000 });
```

---

## 6.2 mutation 完了同期 assert（result 待機・count 境界）

result サマリー `data-testid="bulk-tag-result"`（`aria-live="polite"`）は `runBulkTags()` 成功時のみ DOM に現れる（`BulkActionBar.tsx:387-417`）。**read-only spec（issue-1077）が `bulk-tag-result` の count 0 を assert するのと正反対に**、本 spec は apply 後に result が出現することを待ち、status 別 count の境界を assert する。

| test | 待機 assert | count 境界 assert |
| --- | --- | --- |
| all-success | `bulk-tag-result` visible | `bulk-tag-result-skipped` count 0 / `bulk-tag-result-not-found` count 0（付与>0・skipped=0・notFound=0） |
| partial-failure | `bulk-tag-result` visible + `bulk-tag-result-skipped` visible | `bulk-tag-result-skipped` count ≥1（退会済みスキップ ≥1）・`bulk-tag-result-not-found` count 0 |

```ts
// all-success: result 待機 + skipped/notFound 0 境界
await expect(page.getByTestId("bulk-tag-result"), "apply 後 result 未描画").toBeVisible({ timeout: 20_000 });
await expect(page.getByTestId("bulk-tag-result-skipped")).toHaveCount(0);
await expect(page.getByTestId("bulk-tag-result-not-found")).toHaveCount(0);

// partial-failure: skipped が出現することを待つ（退会済みスキップ ≥1）
await expect(page.getByTestId("bulk-tag-result-skipped"), "退会済み skipped が出ていない").toBeVisible();
await expect(page.getByTestId("bulk-tag-result-not-found")).toHaveCount(0);
```

> `not-found` は両 test とも count 0（synthetic tag は登録済みのため自然発生しない・Phase 1 §1.2 scope-out）。これを明示 assert することで「partial-failure の原因が退会済み skipped であって、誤った notFound 混入ではない」ことを固定する。

---

## 6.3 新規 runner shell test（`scripts/smoke/__tests__/capture-bulk-tag-result.test.sh`）

参照テンプレート: `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（issue-1081）。差分は **mutation を curl ではなく Playwright が起こす**ため、runner 本体の curl ループ系 assert（`assert_all_status` / `audit_count`）は対象外で、**guard 分岐・引数 parse・seed/cleanup 呼び出し**の shell レベル検証に限定する点。**実 D1 / 実 staging / 実 Playwright を一切叩かない**（Phase 3 §3.5・AC-7）。

### 検証ケース

| ID | 検証内容 | 期待 exit | 手段 |
| --- | --- | --- | --- |
| RT-SH-01 | env 未指定で拒否 | 2 | `bash "$RUNNER"`（引数なし） |
| RT-SH-02 | production target 拒否 | 2 | `bash "$RUNNER" production` |
| RT-SH-03 | 非 staging 環境名拒否 | 2 | `bash "$RUNNER" dev` |
| RT-SH-04 | `PLAYWRIGHT_STAGING_BASE_URL` 未設定で拒否 | 2 | env 無しで `staging` |
| RT-SH-05 | production URL 拒否 | 2 | `PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-api-production... staging` |
| RT-SH-06 | 非 staging `CF_D1_DATABASE` 拒否 | 2 | `CF_D1_DATABASE=ubm-hyogo-db-production staging` |
| RT-SH-07 | 不明引数で拒否 | 2 | `staging --bogus` |
| RT-SH-08 | redact が secret を伏字化 | 0 + `[REDACTED]` | `redact.sh` に bearer/cookie を流す（issue-1081 と同型） |
| RT-SH-09 | stub 経路で seed→capture→cleanup が呼ばれ exit 0 | 0 | fake `cf.sh`（`--file` を success 返却 / count を 0 返却）+ fake `playwright`（snapshot を作らず exit 0）を PATH/`CF_SH_PATH`/`PLAYWRIGHT_BIN_OVERRIDE` で注入し `--skip-seed` なしで起動 |
| RT-SH-10 | cleanup 残存検出で fail | 非 0 | fake `cf.sh` が cleanup 後 count に非 0 を返す → `cleanup-<table>` で fail_and_exit |

### スタブ注入の骨子（実 D1 を叩かない）

runner 側で capture を `pnpm ... exec playwright test` 直書きせず、**`PLAYWRIGHT_BIN_OVERRIDE`（既定 = 実 playwright 起動コマンド）** 経由にしておくと、shell test から fake playwright（即 exit 0）を差し込める。`run_d1` は issue-1081 同様 `CF_SH_PATH` で fake `cf.sh` に差し替える。

```bash
# fake cf.sh: --file は success、count クエリは 0 を返す（cleanup 残存 0 を満たす）
cat > "$TEST_DIR/cf.sh" <<'SH'
#!/usr/bin/env bash
args="$*"
if [[ "$args" == *"--file"* ]]; then printf '{"success":true}\n'
else printf '{"result":[{"results":[{"c":0}]}]}\n'; fi
SH
chmod +x "$TEST_DIR/cf.sh"

# fake playwright: snapshot を作らず即成功
cat > "$FAKE_BIN/playwright" <<'SH'
#!/usr/bin/env bash
exit 0
SH
chmod +x "$FAKE_BIN/playwright"

PATH="$FAKE_BIN:$PATH" \
PLAYWRIGHT_STAGING_BASE_URL=http://staging.example.test \
CF_SH_PATH="$TEST_DIR/cf.sh" \
PLAYWRIGHT_BIN_OVERRIDE="$FAKE_BIN/playwright" \
  bash "$RUNNER" staging --out-dir "$TEST_DIR/evidence" --ci-summary
```

> RT-SH-09 は「seed→capture→cleanup の edge が壊れていない」ことを実 D1 なしで保証する回帰 guard。RT-SH-10 は AC-5（cleanup 残存 0 検証）の fail path を機械化する。

---

## 6.4 回帰 guard（既存テストの再確認）

新規ファイル追加のみで apps ソースを変更しないため、機能本体の回帰は既存 component spec の無変更緑維持で担保する。

| 対象 | 内容 | 実行 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | result summary（counts / skipped / notFound）描画・TC-BAB-TAG-01..05 + a11y violations 0 | focused vitest（local 検証で実行） |

apps ソースに変更が無いことから上記 spec は無変更で緑が維持される（変化したらスコープ逸脱＝即 stop シグナル）。

---

## 6.5 完了条件（Phase 6）

- Playwright spec の FP-01..05 fail path と result 待機・skipped/notFound count 境界 assert が設計されている
- 新規 runner shell test `capture-bulk-tag-result.test.sh` の RT-SH-01..10（guard 拒否 / 引数 parse / cleanup 呼び出し・実 D1 非接続）が設計されている
- `BulkActionBar.spec.tsx` を回帰 guard として参照している
