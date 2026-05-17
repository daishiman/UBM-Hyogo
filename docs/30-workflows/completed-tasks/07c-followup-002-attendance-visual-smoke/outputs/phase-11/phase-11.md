# Phase 11: 手動テスト / VISUAL evidence

[実装区分: 実装仕様書]

attendance UI の visual evidence（screenshot + Playwright trace + a11y log）
を canonical path で取得するための手順を仕様化する。

> VISUAL/NON_VISUAL 分類: **VISUAL**
> 主成果物が screenshot（attendance UI の状態遷移を写真として証明）であるため。

## 1. 取得すべき evidence 一覧

### 1.1 screenshot

| AC | ファイル名（canonical path） | 状態 |
|----|------------------------------|------|
| AC-1 | `outputs/phase-11/screenshots/attendance-deleted-excluded.png` | 削除済み member `m-5` が candidates に出ない |
| AC-2 | `outputs/phase-11/screenshots/attendance-already-registered.png` | 既登録 `m-1` を click → toast 表示 |
| AC-3 | `outputs/phase-11/screenshots/attendance-dup-1.png` | 1 回目 register 成功直後 |
| AC-3 | `outputs/phase-11/screenshots/attendance-dup-2.png` | 同 member 2 回目 → 409 toast |
| AC-4 | `outputs/phase-11/screenshots/attendance-delete-before.png` | list page で `m-2` が出席者 |
| AC-4 | `outputs/phase-11/screenshots/attendance-delete-after.png` | 削除後 `m-2` が消失 + toast |

### 1.2 Playwright trace

| AC | パス | 用途 |
|----|------|------|
| AC-4 | `outputs/phase-11/trace/attendance-delete-trace.zip` | delete 操作の操作軌跡。`--trace on` で取得 |

### 1.3 a11y / 検証 log（`.txt` / `.json` のみ）

| ファイル | 内容 |
|----------|------|
| `outputs/phase-11/e2e-run.txt` | `playwright test ... 2>&1 \| tee` の標準出力 |
| `outputs/phase-11/e2e-list.txt` | `playwright test --list` の出力 |
| `outputs/phase-11/e2e-skip-count.txt` | `grep -c` で `0` のみ記録 |
| `outputs/phase-11/runner-version.txt` | `playwright --version` |
| `outputs/phase-11/verify-design-tokens.txt` | `pnpm verify:tokens` 出力 |
| `outputs/phase-11/phase11-capture-metadata.json` | provenance / viewport / timestamp（Phase 2 §6.3 schema） |
| `outputs/phase-11/screenshot-plan.json` | screenshot capture 計画 |
| `outputs/phase-11/manual-test-result.md` | 視覚レビュー所見 |
| `outputs/phase-11/ui-sanity-visual-review.md` | Apple UI/UX 観点レビュー |

> INV-10 により `.log` は不可。`.txt` / `.json` / `.md` / `.zip` / `.png` のみ canonical。

## 2. 取得手順（local mock-screenshot 経路）

### 2.1 経路許容根拠（phase-11-screenshot-guide §「VISUAL タスクの local mock-screenshot 経路」許容条件 4 件）

| # | 条件 | 本タスクでの充足 |
|---|------|-----------------|
| 1 | staging 実機 smoke が**別タスクで分離・user 承認済み** | 09a staging smoke が責務として既に切り出されており、本タスクの metadata `staging_replacement_plan` で参照する |
| 2 | mock は**standalone HTTP server** | `apps/web/playwright/fixtures/auth.ts` の `ensureMockApi()` を拡張する設計（Phase 2 §5）。`page.route()` を使わない |
| 3 | SSR fetch 経路も standalone mock 経由 | Phase 4 で `playwright.config.ts#webServer.env.INTERNAL_API_BASE_URL=http://127.0.0.1:8787` を verify（Phase 3 R-3） |
| 4 | `provenance: local-mock` を `phase11-capture-metadata.json` に明記 | Phase 2 §6.3 / 本 Phase §1.3 |

→ 4 件すべて充足。**local mock-screenshot 経路 許可**。

### 2.2 実行 step

```bash
# 0. canonical 出力先 ensure
mkdir -p docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/{screenshots,trace}

# 1. tooling version 記録
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/runner-version.txt

# 2. spec 列挙
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --list \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-list.txt

# 3. skip 不在確認
grep -Ec "TODO\(08b\)|test\.describe\.skip|test\.skip\(true|test\.fixme" \
  apps/web/playwright/tests/attendance.spec.ts \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt

# 4. design tokens 検証
mise exec -- pnpm verify:tokens \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/verify-design-tokens.txt 2>&1

# 5. evidence 取得込み完全実行
PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
    playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on \
    2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt
```

## 3. screenshot capture 規約

- spec 内で `await page.screenshot({ path: <canonical-absolute-path>, fullPage: false })` を使用
- 絶対パスは `PLAYWRIGHT_EVIDENCE_TASK` から組立（spec helper で実装）
- viewport は 1280x800 desktop（Phase 2 §4）
- mask 不要（seed 値固定）
- AC-4 trace は `testInfo.attach('trace', ...)` ではなく Playwright の `--trace on` 自動出力を `outputs/phase-11/trace/attendance-delete-trace.zip` へ move

## 4. completed evidence 条件

evidence_status は次のすべてを満たして `captured` 済み:

1. §1.1 の screenshot 6 枚すべてが canonical path に存在
2. §1.2 の trace zip が存在
3. §1.3 の `.txt` / `.json` / `.md` がすべて存在
4. `e2e-skip-count.txt` の中身が `0`
5. `e2e-run.txt` 末尾に Playwright の `passed` summary が存在し `failed` が `0`
6. `phase11-capture-metadata.json.provenance === "local-mock"` かつ `screenshots[].file` 6 件が §1.1 と一致
7. `verify-design-tokens.txt` が exit 0 相当
8. `MeetingPanel.tsx` は `data-testid` 追加のみで、design-token gate が成功している

## 5. metadata schema 必須 field（再掲）

```json
{
  "task_id": "07c-followup-002-attendance-visual-smoke",
  "issue_number": 313,
  "provenance": "local-mock",
  "browser": "chromium",
  "viewport": { "width": 1280, "height": 800 },
  "captured_at": "<ISO8601>",
  "spec": "apps/web/playwright/tests/attendance.spec.ts",
  "mock_api_base": "http://127.0.0.1:8787",
  "screenshots": [ /* AC-1..AC-4 の 6 件 */ ],
  "staging_replacement_plan": {
    "unassigned_task": "09a staging smoke で fresh evidence へ差し替え",
    "owner": "task-09a-staging-deploy-smoke"
  }
}
```

## 6. 非適合時の対応

| 不適合 | 対応 |
|--------|------|
| screenshot 欠落 | spec を再実行し canonical path に出力。`git add` で commit |
| `e2e-skip-count.txt != 0` | spec から `test.skip` / `test.fixme` / `TODO(08b)` を完全除去 |
| visual baseline diff 発生 | INV-06 により user gate 必須。本 PR では `--update-snapshots` を実行しない |
| provenance 不正 | metadata JSON を修正し、commit に含める |

## 7. 視覚レビュー所見テンプレート (`manual-test-result.md`)

```markdown
## Apple UI/UX 観点レビュー（attendance UI）

- ヒエラルキー: candidates と attendees の階層が明確か
- フィードバック: toast の表示時間と位置（`role="status"`）
- 一貫性: list / detail で attendance 操作の UI 文法が揃っているか
- 余白とリズム: 8pt grid との整合
- 削除済み member 表示の抑制が UX を損なわないか
```

## 8. 次フェーズ引き継ぎ

Phase 12 で:

- evidence_status の現時点判定（仕様書 PR 時点では `runtime_pending`）
- system-spec への影響（なし想定）
- skill フィードバック（特記なし想定）
- documentation-changelog の Step 判定
