**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 11.1 VISUAL 区分の明示

本タスクは **VISUAL タスク**である。dismiss（別人マーク）confirm 実行直後に row が一覧から消える視覚変化、および server error 時の row 復元 + inline error 表示 + dismiss 理由入力値の保持という UI 状態遷移を伴うため、screenshot による視覚 evidence を取得した。

## 11.2 実装・自動検証結果

| evidence | path | result |
| --- | --- | --- |
| focused Vitest | `outputs/phase-11/evidence/focused-vitest.log` | PASS（1 file / 14 tests） |
| Playwright focused | `outputs/phase-11/evidence/playwright-dismiss.log` | PASS（desktop-chromium / 2 tests） |
| Playwright JSON | `outputs/phase-11/evidence/playwright-report/results.json` | present |
| Monocart report | `outputs/phase-11/evidence/monocart/index.html` | present |
| canonical paths manifest | `outputs/phase-11/canonical-paths.json` | present |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | present |

Focused Vitest は `IdentityConflictRow.spec.tsx` で dismiss optimistic hide / success-stays-hidden / rollback + reason retention / rollback 後再実行 / dismiss→merge 非干渉と merge 既存回帰を検証した。Playwright は local dev server + SSR fixture で dismiss optimistic hide と rollback UI を検証した。

## 11.3 screenshot evidence（canonical 名固定）

| # | canonical ファイル名 | 取得状態 | 対応 TC / AC | result |
| --- | --- | --- | --- | --- |
| 1 | `screenshots/identity-conflict-row-dismiss-optimistic-removed.png` | 「別人として確定」click 直後、server 応答前に該当 row が一覧から消えた状態 | TC-VIS-01 / AC-2 | present (1280x880 PNG) |
| 2 | `screenshots/identity-conflict-row-dismiss-rollback-error.png` | server error で row が復元し、inline error が表示され、dismiss 理由入力値が保持された状態 | TC-VIS-02 / AC-3 | present (1280x902 PNG) |

## 11.4 3層評価観点

| 層 | 評価観点 | screenshot との対応 | 判定 |
| --- | --- | --- | --- |
| Semantic（意味） | dismiss confirm の文言と error rollback の意味が伝わること | #1 / #2 | PASS |
| Visual（視覚） | row 消失で list レイアウトが崩れず、inline error が danger tone で表示されること | #1 / #2 | PASS |
| AI UX（操作体感） | click 後に待ち感なく row が消え、error 時は理由保持のまま再操作可能なこと | #1 / #2 | PASS |

## 11.5 実行コマンド

```bash
pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_BASE_URL=http://localhost:3000 \
PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 \
PLAYWRIGHT_ISSUE1042_SCREENSHOT_DIR="$PWD/docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/screenshots" \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/evidence \
pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/admin-identity-conflicts.spec.ts \
  --project=desktop-chromium \
  --grep "dismiss.*optimistic|dismiss error"
```

## 11.6 evidence 整合チェック

| チェック | 内容 | 判定 |
| --- | --- | --- |
| 枚数整合 | `outputs/phase-11/screenshots/` の `.png` が 2 枚 | PASS |
| 命名整合 | phase-11.md / capture metadata / implementation-guide の screenshot 名が一致 | PASS |
| 状態整合 | 各 png が消失 / 復元+error+理由保持を表す | PASS |
| Gate-B | root / outputs `artifacts.json` の Gate-B を passed に更新 | PASS |

## 11.7 VISUAL 判定

**GATE: PASS**。dismiss optimistic update は実コード、focused Vitest、Playwright focused、screenshot 2 PNG のすべてで確認済み。commit / push / PR / Issue close は Phase 13 の user-gated 操作として未実行。
