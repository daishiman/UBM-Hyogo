# Phase 9: 品質保証

[実装区分: 実装仕様書]

Phase 5-8 で実装・整理した attendance visual smoke 一式に対し、
quality-gates 全項目を pass させる手順を確定する。
本 Phase は **検証実行手順 + 失敗時の対応 + 引き継ぎ** を担う（実装変更は伴わない）。

## 0. Close-out reconciliation

実装レビューで、`coverage-summary.json`、`coverage-gate.txt`、`selector-audit.txt`、`visual-diff.txt` は本タスクの必須 close-out evidence としては過剰であると判定した。今回サイクルの必須 gate は次の実測 evidence に限定する。

| Gate | Required evidence |
| --- | --- |
| Focused Playwright | `outputs/phase-11/e2e-run.txt`（4 passed / 0 failed / 0 skipped） |
| Spec inclusion | `outputs/phase-11/e2e-list.txt` |
| Skip / todo absence | `outputs/phase-11/e2e-skip-count.txt = 0` |
| Tooling version | `outputs/phase-11/runner-version.txt` |
| Design token drift | `outputs/phase-11/verify-design-tokens.txt` |
| Visual evidence | `outputs/phase-11/screenshots/*.png` 6 枚 + `trace/attendance-delete-trace.zip` |

API detail route の欠落は code gate failure として同一 wave で修正し、`apps/api/src/routes/admin/meetings.contract.spec.ts` に contract test を追加した。

## 1. quality gates 一覧

| Gate | 対象 | pass 条件 | 実行コマンド | 失敗時の章 |
|------|------|----------|-------------|-----------|
| G-1 typecheck | repo 全体 TypeScript | `tsc --noEmit` exit 0 | `mise exec -- pnpm typecheck` | §4.1 |
| G-2 lint | ESLint / 静的検査 | exit 0、warning 増えない | `mise exec -- pnpm lint` | §4.2 |
| G-3 unit test | `apps/web` / `apps/api` Vitest | 全 spec pass | `mise exec -- pnpm test` | §4.3 |
| G-4 e2e (attendance) | Playwright smoke | 4 test pass、flake retry ≤ 1 | §2.1 | §4.4 |
| G-5 e2e coverage | attendance lines.pct | `>= 80%` | §2.2 | §4.5 |
| G-6 verify:tokens | HEX 直書き不在 | exit 0 | `mise exec -- pnpm verify:tokens` | §4.6 |
| G-7 verify-test-suffix | `*.test.ts` 不在 | grep hit = 0 | §2.3 | §4.7 |
| G-8 block-test-suffix (lefthook) | commit 時の reject | hook 正常動作 | §2.3 | §4.7 |
| G-9 skip 0 | `attendance.spec.ts` 内 skip / fixme / TODO(08b) | 0 件 | §2.4 | §4.8 |
| G-10 selector drift | cheat-sheet と spec の整合 | grep gate pass | §2.5 | §4.9 |
| G-11 visual baseline diff | 17 routes baseline | diff = 0（または user approve） | §2.6 | §4.10 |
| G-12 CI playwright-smoke | GH Actions | `smoke (chromium)` green | PR 上で確認 | §4.11 |

## 2. 1 行実行コマンド集

### 2.1 G-4: e2e attendance（local）

```bash
# 通常実行
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium

# evidence 取得込み
PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
    playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on \
    --reporter=list,monocart-reporter \
    2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt
```

### 2.2 G-5: coverage gate

```bash
# 計測 → 抽出 → 判定
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium \
  --reporter=list,monocart-reporter

pct=$(jq '.total.lines.pct' apps/web/coverage/e2e/coverage-summary.json)
echo "lines.pct=${pct}"
awk -v p="$pct" 'BEGIN { exit !(p+0 >= 80) }' \
  && echo "G-5 PASS" || echo "G-5 FAIL"
```

結果保存:

```bash
{
  echo "lines.pct=${pct}"
  awk -v p="$pct" 'BEGIN { print (p+0 >= 80) ? "result=pass" : "result=fail" }'
} > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/coverage-gate.txt
```

### 2.3 G-7 / G-8: test suffix

```bash
# verify-test-suffix（CI gate と同 logic）
git ls-files 'apps/web/**/*.test.ts' 'apps/web/**/*.test.tsx' \
             'apps/api/**/*.test.ts' 'apps/api/**/*.test.tsx' \
  | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/verify-test-suffix.txt
# 出力 0 行が期待

# block-test-suffix lefthook の動作確認（dry-run）
.git/hooks/pre-commit || true
```

`verify-test-suffix.txt` が 0 行であることを Phase 11 evidence として保存する。

### 2.4 G-9: skip 0

```bash
grep -cE 'TODO\(08b\)|test\.skip|test\.fixme|test\.describe\.skip|it\.todo' \
  apps/web/playwright/tests/attendance.spec.ts \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt
cat docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt
# 0 を期待
```

### 2.5 G-10: selector drift

```bash
grep -nE 'attendance-(candidate|register|attendee|select|toast|list-session|add-attendance|remove-attendance)' \
  apps/web/playwright/tests/attendance.spec.ts \
  apps/web/playwright/page-objects/AdminMeetingsPage.ts \
  apps/web/playwright/fixtures/admin-meetings.ts \
  apps/web/playwright/fixtures/auth.ts \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/selector-audit.txt
```

`outputs/phase-11/selector-audit.txt` を Phase 8 §2.4 cheat-sheet と突き合わせ、未列挙 selector が無いことを目視確認。差分があれば Phase 8 RF-6 へ差し戻し。

### 2.6 G-11: visual baseline diff

```bash
# baseline 影響確認（data-testid 追加のみで diff=0 を期待）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=visual-desktop --grep '@admin-meetings' \
  2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/visual-diff.txt
```

diff = 0 を期待。差分があれば §4.10。

### 2.7 まとめて回す one-liner

```bash
set -e
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium \
  --reporter=list,monocart-reporter
```

すべて exit 0 になれば G-1〜G-6 + G-10 が pass。残り G-7〜G-12 は §2.3〜2.6 / CI で個別検証。

## 3. flaky 検出時の対応

### 3.1 retries

`playwright.config.ts` の smoke project は `retries: process.env.CI ? 2 : 0` を既存設定として継承する（Phase 5 で確認）。

| 状況 | 対応 |
|------|------|
| 1 retry で pass | flake 候補。trace を確認して根本原因調査 |
| 2 retry でも fail | flake ではなく real fail。実装側を疑う |
| local fail / CI pass | 環境差。`webServer.env` / mock seed reset 漏れを疑う |

### 3.2 trace artifact

flaky 時に取得すべき artifact:

```bash
# 失敗した test の trace を Phase 11 evidence へ退避
mkdir -p docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace
find apps/web/test-results -name 'trace.zip' -exec \
  cp {} docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace/ \;
```

ファイル名は `attendance-<ac>-<n>-trace.zip` にリネームし、`phase11-capture-metadata.json` の `flaky_traces[]` に列挙する。

### 3.3 re-run runbook（簡易版）

```bash
# 1. 該当 test のみ re-run
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium \
  --grep "delete 後 attendance state" --repeat-each=5

# 2. 5 回連続 pass で flake 解消と判定
# 3. 1 度でも fail なら mock state reset 漏れを疑い beforeEach 確認
```

### 3.4 flake 判定の本サイクル内ルール

CONST_007 に従い、本サイクル内で以下のいずれかに到達するまでは PR を出さない:

1. 5 連続 pass（§3.3 step 2）
2. 根本原因を特定し、コードまたは fixture に修正を入れて pass

「再現しないので様子見」は禁止。

## 4. 失敗時の対応

### 4.1 G-1 typecheck 失敗

- 直近の Phase 5/8 編集が import / 型エクスポートを壊した可能性
- `tsc --noEmit --pretty` で該当行特定
- 修正後、Phase 9 全 gate を再実行

### 4.2 G-2 lint 失敗

- まず `pnpm lint --fix`
- 残る違反は手修正（autofix 不可なものを想定: unused import, no-explicit-any, await-thenable）

### 4.3 G-3 unit test 失敗

- attendance 関連の単体 spec は本タスクスコープ外（既存）
- 失敗があれば Phase 5/8 の波及で `MeetingPanel.tsx` / `MeetingAttendancePanel.tsx` の export / props 互換性を壊していないか確認

### 4.4 G-4 e2e 失敗

- `mockApi.reset()` 漏れ → `test.beforeEach` 配置確認（Phase 8 §3.3）
- selector mismatch → Phase 8 §2.4 cheat-sheet と grep audit（§2.5）
- SSR 404 → `INTERNAL_API_BASE_URL` 設定（Phase 3 R-3 / Phase 4 F-1）確認

### 4.5 G-5 coverage 未達

Phase 7 §4 例外申請手順に従う。本サイクル内で:

1. uncovered line を `lcov.info` から抽出
2. 該当 branch を踏む追加 test を spec に追加 or 許容 path を allowlist 除外
3. `coverage-gate-rationale.md` を更新
4. 再計測して `lines.pct >= 80` を達成

「次サイクルに先送り」は禁止（CONST_007）。

### 4.6 G-6 verify:tokens 失敗

- Phase 8 で `data-testid` 追加のみのはずだが、誤って HEX 直書きを入れた可能性
- 失敗 file を tokens.css 経由に置換
- `apps/web/src/styles/tokens.css` を正本に従う（INV-03）

### 4.7 G-7 / G-8 test suffix

- `*.test.ts` / `*.test.tsx` 検出時は `*.spec.ts` にリネーム
- lefthook が動作しない場合は `pnpm install` で再 install（CLAUDE.md「Git hook の方針」）

### 4.8 G-9 skip 残留

- Phase 8 §3.1 grep 結果が 1 以上 → 該当行を削除
- `test.fixme` を `test()` に戻す or test 自体を削除
- どちらか判断不能な場合は spec 構造（Phase 8 §3.3）に揃える

### 4.9 G-10 selector drift

- §2.5 grep 結果を Phase 8 §2.4 cheat-sheet と diff
- 未列挙 selector は cheat-sheet に追加 or spec/page-object を統一 selector に修正

### 4.10 G-11 visual diff 検出

- `data-testid` のみ追加で視覚に影響しない設計（Phase 2 §3）。diff が発生した場合は anti-aliasing 差分等の環境要因を最初に疑う
- 真の視覚 diff の場合は `outputs/phase-11/visual-diff-note.md` に diff 内容を記録し、user gate (`--update-snapshots`) を user 承認後に実施する旨を明記（INV-06）
- 本 PR では baseline を更新しない

### 4.11 G-12 CI fail

- GH Actions log を取得 → 失敗 job の last 100 lines を `outputs/phase-11/ci-failure.txt` に保存
- local で再現を試行（§3.3 runbook）
- 再現できれば修正、再現しなければ flake として §3 へ

## 5. evidence チェックリスト（Phase 11 への引き継ぎ）

Phase 9 を通過した時点で、以下 evidence が canonical path（`outputs/phase-11/`）に揃っていること。

| evidence | 由来 gate | required |
|----------|----------|----------|
| `e2e-run.txt` | G-4 | ✔ |
| `e2e-list.txt` | G-4 | ✔ |
| `e2e-skip-count.txt`（= 0） | G-9 | ✔ |
| `runner-version.txt` | G-4 | ✔ |
| `coverage-summary.json` | G-5 | 任意診断 |
| `coverage-gate.txt`（result=pass） | G-5 | 任意診断 |
| `coverage-gate-rationale.md` | G-5 | 任意診断の未達時のみ |
| `verify-design-tokens.txt` | G-6 | ✔ |
| `verify-test-suffix.txt`（0 行） | G-7 | 任意診断 |
| `selector-audit.txt` | G-10 | 任意診断 |
| `visual-diff.txt` | G-11 | 任意診断 |
| `visual-diff-note.md` | G-11 | 任意診断で diff>0 のみ |
| `screenshots/*.png`（6 枚） | AC-1〜AC-4 | ✔ |
| `trace/attendance-delete-trace.zip` | AC-4 | ✔ |
| `phase11-capture-metadata.json` | AC-9 | ✔ |
| `screenshot-plan.json` | Phase 2 §6.1 | ✔ |
| `manual-test-result.md` | Phase 2 §6.1 | ✔ |
| `ui-sanity-visual-review.md` | Phase 2 §6.1 | ✔ |
| `ci-failure.txt` | G-12 | fail 時のみ |

> `.log` 拡張子は INV-10 違反のため不可。すべて `.txt` / `.json` / `.md` / `.png` / `.zip` で保存。

## 6. Phase 11 / Phase 12 への申し送り

### 6.1 Phase 11 引き継ぎ事項

- §5 evidence 一覧の required=✔ の項目を取得 checklist として使用し、任意診断項目は実施した場合のみ保存する
- `coverage-summary.json` は任意診断を実施した場合のみ `apps/web/coverage/e2e/` から `outputs/phase-11/` に複写する
- trace zip のファイル名は `attendance-<ac>-trace.zip` 形式で統一（複数 flake trace 保存時も identifier 付与）
- `phase11-capture-metadata.json` の `provenance` は固定で `"local-mock"`（INV-09）
- `staging_replacement_plan.owner` は Phase 12 までに確定（Phase 3 F-4 残課題）

### 6.2 Phase 12 引き継ぎ事項

- spec_created → spec_verified への状態遷移条件: §5 evidence の required=✔ が tracked file としてすべて存在
- compliance check で参照する spec section: 本 Phase §1 quality gates 表
- Phase 12 canonical heading SSOT 反映時、本 Phase の `task-specification-creator quality-gates §7.5` 参照を更新する（spec 名の drift があれば追従）

### 6.3 PR（Phase 13）引き継ぎ事項

- PR base: `dev`（CLAUDE.md 既定）
- PR body には §5 evidence 一覧へのリンクと、G-1〜G-12 すべて pass を表で記載
- coverage 未達があった場合は §4.5 の rationale.md パスを PR body に明示
- baseline 更新が必要だった場合は user-gated operation として明示（INV-06）

## 7. DoD（Phase 9 完了条件）

| # | 条件 |
|---|------|
| 1 | G-1〜G-11 のうち、local 実行できる gate（G-12 以外）がすべて pass |
| 2 | §5 evidence checklist の required 項目がすべて canonical path に存在 |
| 3 | flaky 発生時の対応が §3 に従って完了している |
| 4 | 失敗時対応（§4）で先送りした項目がない（CONST_007 遵守） |
| 5 | Phase 11 / 12 / 13 引き継ぎ事項（§6）が明文化されている |
