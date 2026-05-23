# Phase 7: カバレッジ確認

[実装区分: 実装仕様書]

Phase 5-6 で実装した Playwright spec / page object / mock 拡張に対し、
E2E lines coverage を計測し、`task-specification-creator` quality-gates §7.5 が定める
`lines.pct >= 80` を満たすことを確認する。本サイクル（CONST_007）内で達成しきる前提で、
未達時の例外申請手順までを本 Phase で書き切る。

## 0. Close-out reconciliation

実装レビューで、本タスクの canonical evidence は visual smoke（4 focused Playwright tests、screenshot 6 枚、trace、skip 0、design-token verification）であり、`coverage-summary.json` / `coverage-gate.txt` を Phase 11 必須 tracked evidence とする記述は過剰であると判定した。coverage 80% gate はリポジトリ横断 E2E coverage タスクで扱う。今回サイクルでは API detail route の contract spec と focused Playwright visual evidence を完了条件にする。

そのため、本 Phase 以下の coverage 計測手順は optional diagnostic とし、Phase 12 の「漏れなし」判定には含めない。

## 1. 計測スコープ

### 1.1 対象モジュール（attendance flow 関連）

E2E coverage の measurement target を以下に限定する。これ以外のファイルは coverage 母集団から除外する（`include` allowlist 方式）。

| 区分 | パス | 含める理由 |
|------|------|-----------|
| UI | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | AC-1/AC-2/AC-3 が踏む CSR 分岐 |
| UI | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | SSR fetch 経路 |
| UI | `apps/web/src/components/admin/MeetingPanel.tsx` | AC-4 が踏む list page CSR 分岐 |
| 補助 | `apps/web/src/lib/admin/server-fetch.ts` | SSR fetch base URL 解決（attendance fetch が通過） |
| fixture | （除外）`apps/web/playwright/fixtures/*` | テストハーネス自身は coverage 対象外 |
| spec | （除外）`apps/web/playwright/tests/*.spec.ts` | テスト自身は対象外 |

### 1.2 対象 spec

`apps/web/playwright/tests/attendance.spec.ts` の 4 test（Phase 2 §4 で確定）。

```text
detail: 削除済み member は候補に出ない
detail: 登録済み member は重複 click で toast 表示
detail: 同一 member 連続登録で 409 → toast 表示（連番 screenshot）
list: delete 後 attendance state が更新される（trace + 連番）
```

### 1.3 測定範囲外の明記

| 区分 | 理由 |
|------|------|
| `apps/api/**` | API detail route は contract spec で担保。E2E coverage の母集団からは除外 |
| `apps/web/src/components/admin/MeetingPanel.tsx` 以外の admin components | 本タスクの spec が踏まないため母集団から除外 |
| design tokens / styling | 視覚 evidence は Phase 11、coverage 対象は logic のみ |

## 2. 計測方式

### 2.1 採用ツール

**任意診断の第一選択: `monocart-reporter`**（Playwright 公式 coverage integration 互換）。
理由は (a) Playwright built-in の V8 coverage を `chromium` から直接取得でき、
(b) `coverage-summary.json` を istanbul 互換 schema で出力可能、
(c) `apps/web` 既存依存に追加負担少（peer は Playwright のみ）。

`apps/web/package.json` に `monocart-reporter` が未導入の場合でも、本タスクの close-out gate には含めない。導入する場合は任意診断として扱う。

**第二選択: `c8` direct mode**（fallback）。
monocart を使わずに任意診断したい場合は、`NODE_V8_COVERAGE=./coverage/e2e/v8` を一時的に指定し、Playwright 終了後に `pnpm dlx c8 report --reporter=json-summary --report-dir=coverage/e2e` で `coverage-summary.json` を生成する。

### 2.2 出力先

| ファイル | 内容 |
|----------|------|
| `apps/web/coverage/e2e/coverage-summary.json` | istanbul json-summary（任意診断） |
| `apps/web/coverage/e2e/coverage-final.json` | per-file detail（diagnostic） |
| `apps/web/coverage/e2e/lcov.info` | HTML report 生成用 |
| `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/coverage-summary.json` | 任意診断を保存する場合の複写先 |
| `outputs/phase-11/coverage-gate.txt` | 任意診断を実施した場合の `pass/fail + 数値` 記録 |

### 2.3 playwright.config.ts 設定（参考）

```ts
// apps/web/playwright.config.ts （追加方針・Phase 5 で実装）
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['monocart-reporter', {
    name: 'attendance-e2e-coverage',
    outputFile: 'coverage/e2e/monocart-report.html',
    coverage: {
      entryFilter: (entry) => true,
      sourceFilter: (path) =>
        /apps\/web\/(app|src)\/.*\.(ts|tsx)$/.test(path) &&
        !/(playwright|\.spec\.|fixtures)/.test(path),
      reports: ['v8-json', 'json-summary', 'lcov'],
      reportPath: 'coverage/e2e',
    },
  }],
],
```

## 3. coverage 診断方針（任意）

### 3.1 閾値

| metric | 閾値 | 根拠 |
|--------|------|------|
| `lines.pct` | >= 80 | quality-gates §7.5 |
| `statements.pct` | >= 80 | 同上（参考） |
| `branches.pct` | >= 70 | flow に if/else 分岐多いため slight relax（参考） |

CI gate には enforce しない。実装レビュー後の必須 gate は focused Playwright 4 test / screenshot 6 枚 / trace / skip 0 / design token 検証に限定する。

### 3.2 分岐踏破の保証

Phase 2 §9 の最終 note に書かれた通り、`onRegister` / `onAdd` / `onRemove` / `setToast` 全分岐を 4 test で踏む設計。
Phase 5 実装エージェントは以下分岐表を spec test ごとに対応付けて network mock seed を組む。

| ファイル | branch | 踏む test |
|----------|--------|-----------|
| `MeetingAttendancePanel.tsx` | `isDeleted` filter | AC-1 |
| `MeetingAttendancePanel.tsx` | `registered.has` 早期 return → toast | AC-2 / AC-3 1st |
| `MeetingAttendancePanel.tsx` | POST success path | AC-3 1st |
| `MeetingAttendancePanel.tsx` | POST 409 path | AC-3 2nd |
| `MeetingAttendancePanel.tsx` | POST 422 (deleted) path | （seed で `attendees:[m-5]` を投げ込み AC-1 内で踏む） |
| `MeetingPanel.tsx` | `setAttended` add | AC-4 before |
| `MeetingPanel.tsx` | `setAttended` remove | AC-4 after |
| `MeetingPanel.tsx` | toast set | AC-4 before/after 双方 |
| `server-fetch.ts` | `INTERNAL_API_BASE_URL` 解決 | 全 test（SSR fetch を通る） |

> AC-1 内で 422 path を踏むため、Phase 5 mock 実装に `deleted member への POST = 422` を必ず含める（Phase 2 §5.2 endpoint 表に既述）。

### 3.3 計測 dry-run

任意診断として実行する場合は、以下を local で実行し、coverage 80% 到達を参考値として確認する。

```bash
# Phase 6 末のセルフチェック
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium \
  --reporter=list,monocart-reporter

# coverage-summary.json の lines.pct を抽出
jq '.total.lines.pct' apps/web/coverage/e2e/coverage-summary.json
```

`>= 80` で任意診断 PASS。未達でも本タスクの close-out gate 失敗とはしない。

## 4. 例外申請手順（80% 未達時の本サイクル内対応）

CONST_007（先送り禁止）に従い、本サイクル内で完結させる。

### 4.1 トリアージ手順

1. `apps/web/coverage/e2e/coverage-final.json` を `jq` で per-file `lines.pct` 降順 sort し、最も未踏な file を 1 件特定
2. `lcov.info` から「未踏 line 範囲」を抽出し、`coverage-uncovered.txt` として `outputs/phase-11/` に保存（evidence 化）
3. 未踏 branch が「本タスクスコープ内 + spec で踏める」場合 → 追加 test を `attendance.spec.ts` に追加（Phase 8 リファクタと併走）
4. 未踏 branch が「本タスクスコープ外（error boundary / auth fail path 等）」場合 → `coverage` allowlist から該当 file を **限定的に除外** し、その diff を `outputs/phase-11/coverage-gate-rationale.md` に記録

### 4.2 allowlist 縮退の許容範囲

以下 path は除外を許容する（本サイクル内決定事項）:

| path | 除外理由 |
|------|---------|
| `apps/web/src/lib/admin/server-fetch.ts` の `error throw` 分岐 | attendance spec は happy path 専用、error boundary 検証は task-05 範疇 |
| `MeetingPanel.tsx` の session 0 件 empty state | seed で sessions 必ず 1 件以上含めるため未踏 |

それ以外の除外は本 Phase 7 の範囲では認めない。spec 追加で踏むこと。

### 4.3 ドキュメント要件

`outputs/phase-11/coverage-gate-rationale.md` に以下を明記:

```markdown
# coverage gate rationale

- 計測値: lines.pct = <N>%
- 閾値: >= 80%
- 結果: pass / fail
- 除外 path（許容範囲 §4.2 内）
  - path
  - 理由
- 追加 test
  - test 名 / 対応 branch
- 最終 lines.pct
```

未達のまま PR を出すことは禁止（CONST_007）。本 rationale に「最終 lines.pct >= 80」が記録されない場合は Phase 9 quality gate が fail 判定する。

## 5. CI 方針

### 5.1 CI 配線

`.github/workflows/playwright-smoke.yml` には focused attendance visual smoke step を追加する。coverage gate は同 workflow に enforce しない:

```yaml
# .github/workflows/playwright-smoke.yml
- name: Run attendance visual smoke
  run: |
    PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 \
    mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
      playwright/tests/attendance.spec.ts --project=desktop-chromium \
      --trace on
```

> PR 上の Actions green は user-gated。ローカルでは同一コマンドを Phase 11 evidence として保存する。

### 5.2 path-filter

`playwright-smoke.yml` の `paths:` は既に `apps/web/**` を含むため、coverage step も同 trigger で動作する。追加変更不要。

### 5.3 artifact

`coverage/e2e/**` は任意診断を行った場合のみ artifact として扱う。canonical evidence は focused smoke の tracked `outputs/phase-11/`。

## 6. evidence 引き継ぎ（Phase 11 への）

| evidence | path | 取得方法 |
|----------|------|---------|
| coverage summary（任意診断） | `outputs/phase-11/coverage-summary.json` | `cp apps/web/coverage/e2e/coverage-summary.json <dest>` |
| coverage gate result（任意診断） | `outputs/phase-11/coverage-gate.txt` | `printf "lines.pct=%s\nresult=pass\n" "$pct" > <dest>` |
| coverage rationale（任意診断の未達時のみ） | `outputs/phase-11/coverage-gate-rationale.md` | 手書き（§4.3 schema） |
| uncovered lines（任意診断の未達時のみ） | `outputs/phase-11/coverage-uncovered.txt` | `lcov.info` から抽出 |

Phase 11 の必須担当範囲には含めない。任意診断を実施した場合のみ tracked evidence として扱う。

## 7. DoD（Phase 7 完了条件）

| # | 条件 | 検証 |
|---|------|------|
| 1 | 計測ツールと出力先が確定 | 本 Phase §2 |
| 2 | 分岐踏破表が 4 test と完全対応 | §3.2 |
| 3 | focused Playwright visual smoke の必須 gate と coverage 任意診断の境界が明確 | §0 / §3 |
| 4 | 未達時の例外申請手順が本サイクル内で書き切られている | §4 |
| 5 | CI gate 配線方針が確定 | §5 |
| 6 | Phase 11 evidence への引き継ぎ path が確定 | §6 |

## 8. Phase 8 への申し送り

- monocart-reporter の reporter 配列追加で `playwright.config.ts` が肥大化する場合は、Phase 8 のリファクタで `playwright/config/reporters.ts` に分離検討
- coverage 計測のため fixture 内で V8 coverage を明示有効化する処理を Phase 5 で入れる場合、それも Phase 8 で fixture helper に切り出し検討
